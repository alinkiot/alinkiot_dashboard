import request from '@/utils/request'

// 查询列表
export function wxBind(session) {
    return request({
        url: '/system/user/wechat/bind',
        method: 'post',
        data: { wechatSession: session}
    })
}

export function wxVerify(sceneId) {
    return request({
        url: '/system/user/wechat/verify',
        method: 'post',
        data: { sceneId : sceneId }
    })
}

export function wxQr() {
    return request({
        url: '/system/user/wechat/qr',
        method: 'get'
    })
}

export function wxUnBind() {
    return request({
        url: '/system/user/wechat/unbind',
        method: 'post'
    })
}

export function wxLogin(Session) {
    return request({
        url: '/system/user/wechat/login',
        method: 'post',
        data: { wechatSession : Session }
    })
}
