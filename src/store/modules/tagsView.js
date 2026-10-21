function getComponentName(view) {
  if (view.matched && view.matched.length) {
    const matched = view.matched[view.matched.length - 1]
    const component = matched.components && matched.components.default
    if (component && component.name) {
      return component.name
    }
  }
  return view.name
}

const MAX_VISITED_VIEWS = 10

const state = {
  visitedViews: [],
  cachedViews: [],
  // 路由 name -> 组件 name 的映射
  cacheNameMap: {}
}

const mutations = {
  ADD_VISITED_VIEW: (state, view) => {
    if (state.visitedViews.some(v => v.path === view.path)) return
    state.visitedViews.push(
      Object.assign({}, view, {
        title: view.meta.title || 'no-name'
      })
    )
    while (state.visitedViews.length > MAX_VISITED_VIEWS) {
      const index = state.visitedViews.findIndex(v => !(v.meta && v.meta.affix) && !/.*\/index/.test(v.path))
      if (index === -1) break
      const removed = state.visitedViews[index]
      state.visitedViews.splice(index, 1)
      const name = state.cacheNameMap[removed.name] || removed.name
      const cacheIndex = state.cachedViews.indexOf(name)
      if (cacheIndex > -1) {
        state.cachedViews.splice(cacheIndex, 1)
      }
      delete state.cacheNameMap[removed.name]
    }
  },
  ADD_CACHED_VIEW: (state, view) => {
    const name = getComponentName(view)
    if (state.cachedViews.includes(name)) return
    if (view.meta && !view.meta.noCache) {
      state.cachedViews.push(name)
      state.cacheNameMap[view.name] = name
    }
  },

  DEL_VISITED_VIEW: (state, view) => {
    for (const [i, v] of state.visitedViews.entries()) {
      if (v.path === view.path) {
        state.visitedViews.splice(i, 1)
        break
      }
    }
  },
  DEL_CACHED_VIEW: (state, view) => {
    const name = state.cacheNameMap[view.name] || view.name
    const index = state.cachedViews.indexOf(name)
    if (index > -1) {
      state.cachedViews.splice(index, 1)
    }
    delete state.cacheNameMap[view.name]
  },

  DEL_OTHERS_VISITED_VIEWS: (state, view) => {
    state.visitedViews = state.visitedViews.filter(v => {
      return v.meta.affix || v.path === view.path
    })
  },
  DEL_OTHERS_CACHED_VIEWS: (state, view) => {
    const name = state.cacheNameMap[view.name] || view.name
    const index = state.cachedViews.indexOf(name)
    if (index > -1) {
      state.cachedViews = state.cachedViews.slice(index, index + 1)
    } else {
      state.cachedViews = []
    }
    const keepName = view.name
    Object.keys(state.cacheNameMap).forEach(key => {
      if (key !== keepName) delete state.cacheNameMap[key]
    })
  },

  DEL_ALL_VISITED_VIEWS: state => {
    const affixTags = state.visitedViews.filter(tag => tag.meta.affix)
    state.visitedViews = affixTags
  },
  DEL_ALL_CACHED_VIEWS: state => {
    state.cachedViews = []
    state.cacheNameMap = {}
  },

  UPDATE_VISITED_VIEW: (state, view) => {
    for (let v of state.visitedViews) {
      if (v.path === view.path) {
        v = Object.assign(v, view)
        break
      }
    }
  },

  DEL_RIGHT_VIEWS: (state, view) => {
    const index = state.visitedViews.findIndex(v => v.path === view.path)
    if (index === -1) {
      return
    }
    state.visitedViews = state.visitedViews.filter((item, idx) => {
      if (idx <= index || (item.meta && item.meta.affix)) {
        return true
      }
      const name = state.cacheNameMap[item.name] || item.name
      const i = state.cachedViews.indexOf(name)
      if (i > -1) {
        state.cachedViews.splice(i, 1)
      }
      delete state.cacheNameMap[item.name]
      return false
    })
  },

  DEL_LEFT_VIEWS: (state, view) => {
    const index = state.visitedViews.findIndex(v => v.path === view.path)
    if (index === -1) {
      return
    }
    state.visitedViews = state.visitedViews.filter((item, idx) => {
      if (idx >= index || (item.meta && item.meta.affix)) {
        return true
      }
      const name = state.cacheNameMap[item.name] || item.name
      const i = state.cachedViews.indexOf(name)
      if (i > -1) {
        state.cachedViews.splice(i, 1)
      }
      delete state.cacheNameMap[item.name]
      return false
    })
  }
}

const actions = {
  addView({ dispatch }, view) {
    dispatch('addVisitedView', view)
    dispatch('addCachedView', view)
  },
  addVisitedView({ commit }, view) {
    commit('ADD_VISITED_VIEW', view)
  },
  addCachedView({ commit }, view) {
    commit('ADD_CACHED_VIEW', view)
  },

  delView({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delVisitedView', view)
      dispatch('delCachedView', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delVisitedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_VISITED_VIEW', view)
      resolve([...state.visitedViews])
    })
  },
  delCachedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_CACHED_VIEW', view)
      resolve([...state.cachedViews])
    })
  },

  delOthersViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delOthersVisitedViews', view)
      dispatch('delOthersCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delOthersVisitedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },
  delOthersCachedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  },

  delAllViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delAllVisitedViews', view)
      dispatch('delAllCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delAllVisitedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_VISITED_VIEWS')
      resolve([...state.visitedViews])
    })
  },
  delAllCachedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_CACHED_VIEWS')
      resolve([...state.cachedViews])
    })
  },

  updateVisitedView({ commit }, view) {
    commit('UPDATE_VISITED_VIEW', view)
  },

  delRightTags({ commit }, view) {
    return new Promise(resolve => {
      commit('DEL_RIGHT_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },

  delLeftTags({ commit }, view) {
    return new Promise(resolve => {
      commit('DEL_LEFT_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
