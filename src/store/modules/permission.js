import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index'
import ParentView from '@/components/ParentView'
import InnerLink from '@/layout/components/InnerLink'
import {toProject} from "@/api/iot/system";

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes)
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      state.topbarRouters = routes
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes
    },
  },
  actions: {
    // 生成路由
    GenerateRoutes({ commit }, project) {
      return new Promise(resolve => {
        // 向后端请求路由数据
        getRouters(project).then(res => {
          const data = JSON.stringify(res.data);
          let sdata, rdata;
          if(project){
            sdata = changePath(JSON.parse(data), toProject(project))
            rdata = changePath(JSON.parse(data), ':project')
          }else{
            sdata = changePath(JSON.parse(data))
            rdata = changePath(JSON.parse(data))
          }
          const sidebarRoutes = filterAsyncRouter(sdata)
          const rewriteRoutes0 = filterAsyncRouter(rdata, false, true)
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
          rewriteRoutes0.push({ path: '*', redirect: '/404', hidden: true })
          const rewriteRoutes = addIndex(project, rewriteRoutes0)
          router.addRoutes(asyncRoutes);
          commit('SET_ROUTES', rewriteRoutes)
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes))
          commit('SET_DEFAULT_ROUTES', sidebarRoutes)
          commit('SET_TOPBAR_ROUTES', sidebarRoutes)
          resolve(rewriteRoutes)
        })
      })
    }
  }
}

function addIndex(project, rewriteRoutes) {
  let index = undefined
  const new_routes = []
  rewriteRoutes.map(route => {
    if(route.path === '/index' || /\/.+\/index/.test(route.path)){
      index = route
    }else{
      new_routes.push(route)
    }
  })
  if(!index){
    index = {
      component: () => import("@/views/index"),
      name: "Index",
      hidden: false,
      meta: { title: "仪表盘", icon: "dashboard"},
    };
  }
  index.path = project ? '/:project/index' : '/index'
  index.meta.affix = true
  new_routes.push({
    isIndex: true,
    path: "",
    component: Layout,
    redirect: "index",
    children: [index],
  })
  return new_routes;
}

function changePath(routes, project) {
  if(project){
    const new_routes = [];
    routes.map(item => {
        item.path = project ? '/'+ project + item.path : item.path;
        new_routes.push(item);
    })
    return new_routes;
  }else{
    return routes;
  }
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = []
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c))
            return
          }
          children.push(c)
        })
        return
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + '/' + el.path
    }
    children = children.concat(el)
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view) => {
  if (process.env.NODE_ENV === 'development') {
    return (resolve) => require([`@/views/${view}.vue`], resolve).catch(() => {
      require([`@/views/${view}/index.vue`], resolve)
    })
  } else {
    return () => import(`@/views/${view}.vue`).catch(() => import(`@/views/${view}/index.vue`))
  }
}

export default permission
