import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'
import {getProject, toProject} from "@/api/iot/system";

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/auth-redirect', '/bind', '/register']

router.beforeEach((to, from, next) => {
  let project = undefined;
  if(to.params.project){
    project = getProject(to.params.project);
  }else{
    project = getProject(to.path)
  }
  NProgress.start()
  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (store.getters.roles.length === 0) {
      isRelogin.show = true
      // 判断当前用户是否已拉取完user_info信息
      store.dispatch('GetInfo').then(() => {
        isRelogin.show = false
        store.dispatch('GenerateRoutes', project).then(accessRoutes => {
          // 根据roles权限生成可访问的路由表
          router.addRoutes(accessRoutes) // 动态添加可访问路由表
          const params = JSON.parse(JSON.stringify(to))
          const path = '/'+ toProject(project) +'/'
          if(to.path === '/' || to.path === '/index' || to.path === path || to.path === path + 'index'){
            const arr = accessRoutes.filter(item => { return item.isIndex });
            if(arr.length > 0){
              const query = arr[0].children[0].query
              if(query){
                params.query = JSON.parse(query)
              }
            }
          }
          if(to.path === '/'+ toProject(project) +'/'){
            params.path = path + 'index'
          }
          next({ ...params, replace: true }) // hack方法 确保addRoutes已完成
        })
      }).catch(err => {
        store.dispatch('LogOut').then(() => {
          Message.error(err)
          next({ path: '/' })
        })
      })
    } else {
      next()
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1 || /.+\/login|register/.test(to.path)) {
      // 在免登录白名单或项目登录，直接进入
      next()
    } else {
      // 判断是不是从项目进来的，如果从项目进来的，则定向到项目登录
      if(project){
        const project2 = toProject(project)
        next(`/${project2}/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
      }else{
        next(`/login?redirect=${to.fullPath}`) // 否则全部重定向到登录页
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
