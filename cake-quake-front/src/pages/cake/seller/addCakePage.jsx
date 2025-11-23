import { useEffect, useRef, useState } from "react";
import CakeBasicInfoForm from "../../../components/cake/itemComponents/cakeBasicInfoForm.jsx";
import CakeImageUploadForm from "../../../components/cake/itemComponents/cakeImageForm.jsx";
import CakeOptionForm from "../../../components/cake/itemComponents/cakeOptionForm.jsx";
import { getOptionTypes, getOptionItems, addCake } from "../../../api/cakeApi.jsx";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../store/AuthContext.jsx";
import AlertModal from "../../../components/common/AlertModal";
import { resizeImageUtile } from "../../../utils/resizeImageUtil.js";
import OKModal from "../../../components/common/OKModal.jsx";
import ButtonSpinner from "../../../components/common/buttonSpinner.jsx";

function CakeAddPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [addCakeDTO, setAddCakeDTO] = useState({
        cname: "",
        price: "",
        description: "",
        category: ""
    });

    const [cakeImage, setCakeImage] = useState([]);

    const [optionTypes, setOptionTypes] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);

    const [formError, setFormError] = useState(null);
    const [showError, setShowError] = useState(false);

    const [isLoading, setIsLoading] = useState(false)

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmMsg, setConfirmMsg] = useState('')
    const confirmResolveRef = useRef(null)

    const openConfirm = (message) => {
        setConfirmMsg(message)
        setConfirmOpen(true)
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve
        })
    }

    const handleConfirm = () => {
        confirmResolveRef.current(true)
        setConfirmOpen(false)
    }

    const handleCancel = () => {
        confirmResolveRef.current(false)
        setConfirmOpen(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddCakeDTO((prev) => ({ ...prev, [name]: value }));
    };

    // 이미지 추가
    const handleImageChange = async (e) => {
        const selectedFiles = Array.from(e.target.files)
        let resultFiles = []

        for (const file of selectedFiles) {
            // 리사이즈 조건 확인
            const { file: resizedFile, resized } = await resizeImageUtile(file)

            if (resized) {
                const proceed = await openConfirm(
                        `이미지 해상도와 용량이 커서 낮게 조정합니다.\n계속 진행하시겠습니까?`
                )

                if (!proceed) {
                    continue   // 파일 건너뛰기
                }
                resultFiles.push(resizedFile)
            } else {
                // 리사이즈 필요 X → 원본 사용
                resultFiles.push(file)
            }
        } // end for

        const newFiles = resultFiles.map((file) => ({
            file,
            src: URL.createObjectURL(file),
            isThumbnail: false,
        }));

        setCakeImage(prev => {
            const updated = [...prev, ...newFiles];
            const hasThumbnail = updated.some(img => img.isThumbnail);
            if (!hasThumbnail && updated.length > 0) {
                updated[0].isThumbnail = true;
            }
            return updated;
        });
    };

    // 썸네일 선택
    const handleThumbnailSelect = (indexToSelect) => {
        setCakeImage((prev) =>
            prev.map((img, index) => ({
                ...img,
                isThumbnail: index === indexToSelect,
            }))
        );
    };

    // 이미지 삭제
    const handleImageRemove = (indexToRemove) => {
        setCakeImage(prev => {
            const updated = prev.filter((img, idx) => {
                if (idx === indexToRemove && img.file) {
                    URL.revokeObjectURL(img.src);
                }
                return idx !== indexToRemove;
            });
            const hasThumbnail = updated.some(img => img.isThumbnail);
            if (!hasThumbnail && updated.length > 0) {
                updated[0].isThumbnail = true;
            }
            return updated;
        });
    };

    // 컴포넌트 언마운트 시 메모리 해제
    useEffect(() => {
        return () => {
            cakeImage.forEach(img => {
                if (img.file && img.src.startsWith('blob:')) {
                    URL.revokeObjectURL(img.src);
                }
            });
        };
    }, [cakeImage]);

    // 옵션 타입 & 아이템 불러오기
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const fetchedOptionTypes = await getOptionTypes(user.shopId);
                const fetchedOptionItems = await getOptionItems(user.shopId);

                const mergedOptionTypes = fetchedOptionTypes.map(type => {
                    const relevantItems = fetchedOptionItems.filter(item =>
                        item.optionTypeId === type.optionTypeId
                    );

                    return {
                        optionTypeId: type.optionTypeId,
                        optionType: type.optionType,
                        optionItems: relevantItems.map(item => ({
                            optionItemId: item.optionItemId,
                            optionName: item.optionName,
                            price: item.price
                        }))
                    };
                });

                setOptionTypes(mergedOptionTypes);
            } catch (err) {
                console.error("옵션 데이터 불러오기 실패", err);
            }
        };

        fetchOptions();
    }, [user.shopId]);

    useEffect(() => {
        if (showError) {
            const timer = setTimeout(() => setShowError(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showError]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true)

            const thumbnailImage = cakeImage.find(img => img.isThumbnail);
            const optionItemIds = selectedOptions.map(option => option.optionItemId);

            if (!addCakeDTO.cname || !addCakeDTO.price) {
                setFormError({ message: "상품명과 가격은 필수 입력 사항입니다.", type: "error" });
                setShowError(true);
                return;
            }

            const addCakeDTOWithAll = {
                ...addCakeDTO,
                imageUrls: [],
                mappingRequestDTO: {
                    optionItemIds: optionItemIds
                },
                thumbnailImageUrl: thumbnailImage ? thumbnailImage.file.name : null
            };

            const formData = new FormData();
            formData.append(
                "addCakeDTO",
                new Blob([JSON.stringify(addCakeDTOWithAll)], { type: "application/json" })
            );

            if (cakeImage.length > 0) {
                cakeImage.forEach((img) => {
                    if (img.file instanceof File) {
                        formData.append("cakeImages", img.file);
                    }
                });
            }

            await addCake(formData);

            setFormError({message: "상품이 성공적으로 등록되었습니다!", type: 'success'});
            navigate(`/shops/${user.shopId}`);

        } catch (error) {
            console.error("상품 등록 실패", error);
            const errorMessage = error.response?.data?.message || error.message || "알 수 없는 오류";
            setFormError({ message: `등록 중 오류 발생: ${errorMessage}`, type: "error" });
            setShowError(true);
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <div>
            <div className="container mx-auto px-6 py-10">
                <h1 className="text-2xl font-semibold mb-6 text-center">새 상품 등록</h1>
                <hr />
                {showError && formError && (
                    <AlertModal
                        message={formError.message}
                        type={formError.type || "error"}
                        show={showError}
                    />
                )}
                <CakeImageUploadForm
                    images={cakeImage}
                    onImageChange={handleImageChange}
                    onImageRemove={handleImageRemove}
                    onThumbnailSelect={handleThumbnailSelect}
                />
                <CakeBasicInfoForm formData={addCakeDTO} onChange={handleChange} />
                <CakeOptionForm optionTypes={optionTypes} selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
                <OKModal
                    show={confirmOpen}
                    message={confirmMsg}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
                <div className="mt-6 flex justify-center">
                    <Link
                        to={`/shops/${user.shopId}`}
                        className="mt-6 border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-100"
                    >
                        취소
                    </Link>
                    <button
                        onClick={handleSubmit}
                        className="mt-6 ml-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                        {isLoading ? <ButtonSpinner /> : "등록"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CakeAddPage;
