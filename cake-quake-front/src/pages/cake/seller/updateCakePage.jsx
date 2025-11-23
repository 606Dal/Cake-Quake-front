import React, {useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import UpdateCake from "../../../components/cake/itemComponents/updateCakeComponent.jsx";
import {getCakeDetail, updateCake, getOptionTypes, getOptionItems} from "../../../api/cakeApi.jsx";
import {useAuth} from "../../../store/AuthContext.jsx";
import AlertModal from "../../../components/common/AlertModal.jsx";
import { resizeImageUtile } from "../../../utils/resizeImageUtil.js";
import OKModal from "../../../components/common/OKModal.jsx";
import ButtonSpinner from "../../../components/common/buttonSpinner.jsx";

function CakeUpdatePage() {
    const {user} = useAuth();
    const { cakeId } = useParams();
    const navigate = useNavigate();
    const [formError, setFormError] = useState(null);
    const [showError, setShowError] = useState(false);

    const [isLoading, setIsLoading] = useState(false)

    // 케이크 기본 정보
    const [updateDTO, setUpdateDTO] = useState({
        cname: "",
        category: "",
        price: "",
        description: "",
        isOnsale: false
    });

    // 이미지 URL 배열 (string)
    const [images, setImages] = useState([]);

    // 옵션
    const [optionTypes, setOptionTypes] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);

    // 이미지 크기 조정 확인 창
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cake = await getCakeDetail(user.shopId, cakeId);

                const {
                    cname,
                    category,
                    price,
                    description,
                    isOnsale,
                    imageUrls,
                } = cake.cakeDetailDTO;

                setUpdateDTO({ cname, category, price, description, isOnsale: isOnsale });

                const loadedImages = imageUrls.map((img) => ({
                    id: img.imageId,
                    src: img.imageUrl,
                    file: null,
                    isThumbnail: img.isThumbnail,
                }));

                setImages(loadedImages);

                setSelectedOptions(cake.options || []);

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
                console.error("데이터 불러오기 실패:", err);
                setFormError({ message: "케이크 정보를 불러오는데 실패했습니다.", type: "error" });
                setShowError(true);
            }
        };

        fetchData();
    }, [user.shopId, cakeId]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setUpdateDTO((prev) => ({...prev, [name]: value}));
    };

    const handleImageChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        let resultFiles = []

        for (const file of selectedFiles) {
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
                resultFiles.push(file)
            }
        } // end for

        const newImageObjects = resultFiles.map(file => ({
            id: null,
            src: URL.createObjectURL(file),
            file: file,
            isThumbnail: false,
        }));

        setImages((prev) => {
            const hasThumbnail = prev.some(img => img.isThumbnail);
            if (!hasThumbnail && newImageObjects.length > 0) {
                newImageObjects[0].isThumbnail = true;
            }
            return [...prev, ...newImageObjects];
        });
    };

    const handleImageRemove = (indexToRemove) => {
        setImages((prevImages) => {
            const updatedImages = prevImages.filter((_, index) => index !== indexToRemove);

            const removedImageWasThumbnail = prevImages[indexToRemove]?.isThumbnail;
            if (removedImageWasThumbnail && updatedImages.length > 0) {
                updatedImages[0].isThumbnail = true;
            }
            return updatedImages;
        });
    };

    const handleThumbnailSelect = (indexToSelect) => {
        setImages((prevImages) =>
            prevImages.map((img, index) => ({
                ...img,
                isThumbnail: index === indexToSelect,
            }))
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true)

            const formData = new FormData();

            const updateCakeDTO = {
                cname: updateDTO.cname,
                category: updateDTO.category,
                price: updateDTO.price,
                description: updateDTO.description,
                isOnsale: updateDTO.isOnsale,
                imageIds: images.filter(img => img.id !== null).map(img => img.id),
                thumbnailImageId: images.find(img => img.isThumbnail)?.id || null,
                optionItemIds: selectedOptions.map(opt => opt.optionItemId),
            };

            const updateDTOBlob = new Blob([JSON.stringify(updateCakeDTO)], { type: "application/json" });
            formData.append("updateCakeDTO", updateDTOBlob);

            images.forEach(img => {
                if (img.file) {
                    formData.append("newCakeImages", img.file);
                }
            });

            await updateCake(user.shopId, cakeId, formData);

            setFormError({ message: "케이크 수정 완료!", type: "success" });
            setShowError(true);
            navigate(`/shops/${user.shopId}/cakes/read/${cakeId}`);

        } catch (error) {
            console.error("케이크 수정 실패:", error);
            setFormError({ message: "케이크 수정 중 오류가 발생했습니다.", type: "error" });
            setShowError(true);
        } finally {
            setIsLoading(false)
        }
    };

    useEffect(() => {
        if (showError) {
            const timer = setTimeout(() => setShowError(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showError]);

    return (
        <>
            <div className="container mx-auto px-6 py-10">
                <h1 className="text-2xl font-semibold mb-3 text-center">상품 수정</h1>
                <hr className="w-1/4 m-auto"/>
                <UpdateCake
                    formData={updateDTO}
                    onChange={handleChange}
                    images={images}
                    onImageChange={handleImageChange}
                    onImageRemove={handleImageRemove}
                    onThumbnailSelect={handleThumbnailSelect}
                    optionTypes={optionTypes}
                    selectedOptions={selectedOptions}
                    setSelectedOptions={setSelectedOptions}
                />
                {showError && formError && (
                    <AlertModal
                        message={formError.message}
                        type={formError.type || "error"}
                        show={showError}
                    />
                )}
                <OKModal
                    show={confirmOpen}
                    message={confirmMsg}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
                <div className="flex justify-center mt-6">
                    <Link
                        to={`/shops/${user.shopId}/cakes/read/${cakeId}`}
                        className="mt-6 border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-100"
                    >
                        취소
                    </Link>
                    <button
                        onClick={handleSubmit}
                        className="mt-6 ml-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                        {isLoading ? <ButtonSpinner /> : "저장"}
                    </button>
                </div>
            </div>
        </>
    );
}

export default CakeUpdatePage;
