<template>
    <div :class="{'has-logo':showLogo}" :style="{ backgroundColor: getStyle('menuBackground') }">
        <logo v-if="showLogo" :collapse="isCollapse" />
        <el-scrollbar
            :class="settings.sideTheme"
            :style="{ '--submenu-background': getStyle('subMenuBackground') }"
            wrap-class="scrollbar-wrapper"
        >
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="getStyle('menuBackground')"
                :text-color="getStyle('menuColor')"
                :unique-opened="false"
                :active-text-color="activeTextColor"
                :collapse-transition="false"
                mode="vertical"
            >
                <sidebar-item
                    v-for="(route, index) in sidebarRouters"
                    :key="route.path  + index"
                    :item="route"
                    :base-path="route.path"
                />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script>
import path from "path";
import { mapGetters, mapState } from "vuex";
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";
import variables from "@/assets/styles/variables.scss";

export default {
    components: { SidebarItem, Logo },
    data() {
        return {
            // 最近一次访问的菜单页路径，进入无菜单的详情页时用来决定高亮哪个父菜单
            lastMenuPath: ''
        };
    },
    watch: {
        $route: {
            immediate: true,
            handler(route) {
                if (this.menuList.some(item => item.path === route.path)) {
                    this.lastMenuPath = route.path;
                }
            }
        }
    },
    computed: {
        ...mapState(["settings"]),
        ...mapGetters(["sidebarRouters", "sidebar"]),
        theme: state => state.settings.theme,
        activeTextColor() {
          const darkSidebars = ['theme-dark', 'theme-dark-blue', 'theme-blue', 'theme-green'];
          return darkSidebars.includes(this.settings.sideTheme) ? '#ffffff' : this.theme;
        },
        // 侧边栏所有「可见」菜单的完整路径与对应组件（菜单来自后端，路径会带项目前缀）。
        // 隐藏菜单（如「快捷菜单」目录下的设备列表）要排除，否则会高亮到一个看不见的菜单上
        menuList() {
            const list = [];
            const walk = (routes, basePath) => {
                (routes || []).forEach(route => {
                    if (route.hidden) return;
                    const fullPath = path.resolve(basePath, route.path || '');
                    list.push({
                        path: fullPath,
                        component: route.meta && route.meta.component,
                        hasQuery: !!route.query
                    });
                    if (route.children) walk(route.children, fullPath);
                });
            };
            walk(this.sidebarRouters, '/');
            return list;
        },
        activeMenu() {
            const { meta, path: routePath } = this.$route;
            const target = meta.activeComponent;
            if (target || meta.activeMenu) {
                // 1. 从哪个菜单进来就高亮哪个（同一个组件可能挂在多个菜单下）
                const last = this.menuList.find(item => item.path === this.lastMenuPath);
                if (last && target && last.component === target) return last.path;
                // 2. activeMenu 指定的路径，兼容带项目前缀的菜单路径
                if (meta.activeMenu) {
                    const hit = this.menuList.find(item => item.path === meta.activeMenu || item.path.endsWith(meta.activeMenu));
                    if (hit) return hit.path;
                }
                // 3. 组件相同的菜单，优先不带固定查询条件的那个
                if (target) {
                    const hits = this.menuList.filter(item => item.component === target);
                    const hit = hits.find(item => !item.hasQuery) || hits[0];
                    if (hit) return hit.path;
                }
                return meta.activeMenu || routePath;
            }
            return routePath;
        },
        showLogo() {
            return this.$store.state.settings.sidebarLogo;
        },
        variables() {
            return variables;
        },
        isCollapse() {
            return !this.sidebar.opened;
        }
    },
  methods: {
    getStyle(key){
      let css = this.settings.sideTheme ? this.settings.sideTheme + '-' + key : key;
      return variables[css] ? variables[css] : variables[key];
    }
  }
};
</script>
