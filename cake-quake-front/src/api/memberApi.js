import jwtAxios from "../utils/jwtUtil"


const baseUrl = import.meta.env.VITE_API_BASE_URL
const endpoints = {
    //----------판매자----------------
    sellerProfile: 'sellers/profile',
    sellerWithdrawe: 'sellers/withdraw',
    //----------구매자----------------
    buyerProfile: 'buyers/profile',
    alarm: 'buyers/profile/alarm',
    buyerWithdraw: 'buyers/withdraw',
}

// ---------------------------판매자---------------------------------

// 판매자 프로필 조회
export const getSellerProfile = async() => {
    try {
        const res = await jwtAxios.get(`${baseUrl}/${endpoints.sellerProfile}`)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// 판매자 프로필 수정
export const modifySellerProfile = async(uid, form) => {
    try {
        const res = await jwtAxios.patch(`${baseUrl}/${endpoints.sellerProfile}/${uid}`, form)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// 판매자 탈퇴
export const withdrawSeller = async() => {
    try {
        const res = await jwtAxios.patch(`${baseUrl}/${endpoints.sellerWithdrawe}`)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// ---------------------------구매자---------------------------------

// 구매자 프로필 조회
export const getBuyerProfile = async() => {
    try {
        const res = await jwtAxios.get(`${baseUrl}/${endpoints.buyerProfile}`)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// 구매자 프로필 수정
export const modifyBuyerProfile = async(uid, form) => {
    try {
        const res = await jwtAxios.patch(`${baseUrl}/${endpoints.buyerProfile}/${uid}`, form)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// 구매자 알람 수정
export const modifyBuyerAlarmSettings = async(uid, form) => {
    try {
        const res = await jwtAxios.patch(`${baseUrl}/${endpoints.alarm}/${uid}`, form)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}

// 구매자 탈퇴
export const withdrawBuyer = async() => {
    try {
        const res = await jwtAxios.patch(`${baseUrl}/${endpoints.buyerWithdraw}`)
        return res.data
    } catch (error) {
        console.error("접근 오류:")
        throw error
    }
}