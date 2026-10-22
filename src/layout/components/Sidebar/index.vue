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
                :unique-opened="true"
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
import { mapGetters, mapState } from "vuex";
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";
import variables from "@/assets/styles/variables.scss";

export default {
    components: { SidebarItem, Logo },
    computed: {
        ...mapState(["settings"]),
        ...mapGetters(["sidebarRouters", "sidebar"]),
        theme: state => state.settings.theme,
        activeTextColor() {
          const darkSidebars = ['theme-dark', 'theme-dark-blue', 'theme-blue', 'theme-green'];
          return darkSidebars.includes(this.settings.sideTheme) ? '#ffffff' : this.theme;
        },
        activeMenu() {
            const route = this.$route;
            const { meta, path } = route;
            // if set path, the sidebar will highlight the path you set
            if (meta.activeMenu) {
                return meta.activeMenu;
            }
            return path;
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
