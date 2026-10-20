<template>
    <div v-loading="loading">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级菜单" prop="parentId">
              <treeselect
                v-model="form.parentId"
                :options="menuOptions"
                :normalizer="normalizer"
                :show-count="true"
                placeholder="选择上级菜单"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio label="M">目录</el-radio>
                <el-radio label="C">菜单</el-radio>
                <el-radio label="F">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.menuType !== 'F'">
            <el-form-item label="菜单图标" prop="icon">
              <el-popover
                placement="bottom-start"
                width="460"
                trigger="click"
                @show="$refs['iconSelect'].reset()"
              >
                <IconSelect ref="iconSelect" @selected="selected" />
                <el-input slot="reference" v-model="form.icon" placeholder="点击选择图标" readonly>
                  <svg-icon
                    v-if="form.icon"
                    slot="prefix"
                    :icon-class="form.icon"
                    class="el-input__icon"
                    style="height: 32px;width: 16px;"
                  />
                  <i v-else slot="prefix" class="el-icon-search el-input__icon" />
                </el-input>
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number style="width: 100%" v-model="form.orderNum" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item>
              <span slot="label">
                <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                是否外链
              </span>
              <el-radio-group v-model="form.isFrame">
                <el-radio label="0">是</el-radio>
                <el-radio label="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item prop="path">
              <span slot="label">
                <el-tooltip content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                路由地址
              </span>
              <el-input v-model="form.path" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType === 'C'">
            <el-form-item prop="component">
              <span slot="label">
                <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                组件路径
              </span>
              <el-input v-model="form.component" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType === 'C'">
            <el-form-item>
              <el-input v-model="form.query" placeholder="请输入路由参数" maxlength="255" />
              <span slot="label">
                <el-tooltip content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`' placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                路由参数
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'M'">
            <el-form-item>
              <permisTable :multiple="form.menuType === 'F'" :queryId="form.perms" @selectDone="selectDone" />
              <span slot="label">
                <el-tooltip content="控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                权限字符
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType === 'C'">
            <el-form-item>
              <span slot="label">
                <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                是否缓存
              </span>
              <el-radio-group v-model="form.isCache">
                <el-radio label="0">缓存</el-radio>
                <el-radio label="1">不缓存</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item>
              <span slot="label">
                <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                显示状态
              </span>
              <el-radio-group v-model="form.visible">
                <el-radio
                  v-for="dict in dict.type.sys_show_hide"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType !== 'F'">
            <el-form-item>
              <span slot="label">
                <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                菜单状态
              </span>
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row style=" padding-bottom: 10px; text-align: right;">
          <el-button type="primary" @click="submitForm">保  存</el-button>
        </el-row>
      </el-form>
    </div>
</template>

<script>
import { listMenu } from "@/api/system/menu";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import IconSelect from "@/components/IconSelect";
import permisTable from "@/components/PermisTable/permisTable";
import {checkRegx} from "@/assets/js/iot";

export default {
  name: "Menu",
  dicts: ['sys_show_hide', 'sys_normal_disable'],
  components: { Treeselect, IconSelect, permisTable },
  props: {
    menu: {
      type: Object,
      default: function () { return undefined }
    },
    parentId: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return {
      // 遮罩层
      loading: false,
      // 菜单树选项
      menuOptions: [],
      // 表单参数
      form: { },
      // 表单校验
      rules: {
        parentId: [
          { required: true, message: "上线菜单不能为空", trigger: "blur" }
        ],
        menuName: [
          { required: true, message: "菜单名称不能为空", trigger: "blur" }
        ],
        orderNum: [
          { required: true, message: "菜单顺序不能为空", trigger: "blur" }
        ],
        path: [
          { self: this, validator: checkRegx, required: true,  message: "路由地址不能为空,肯为a-zA-Z0-9", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getTreeselect();
    // this.setMenu();
  },
  methods: {
    // 选择图标
    selected(name) {
      this.form.icon = name;
    },
    selectDone(permission) {
      if(permission.length > 0){
        // 批量创建
        this.form.perms = '';
      }else {
        this.form.perms = permission.name;
      }
    },
    /** 转换菜单数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.menuId,
        label: node.menuName,
        children: node.children
      };
    },
    /** 查询菜单下拉树结构 */
    getTreeselect() {
      this.loading = true;
      listMenu().then(response => {
        this.loading = false;
        this.menuOptions = [];
        const menu = { menuId: 0, menuName: '主类目', children: [] };
        menu.children = this.handleTree(response.data, "menuId");
        this.menuOptions.push(menu);
      });
    },
    setMenu() {
      this.reset();
      if(this.menu){
        for(let i in this.form){
          const value = this.menu[i];
          if(value && value !==''){
            if(i === 'query' && typeof(value) !== 'string'){
              this.form[i] = JSON.stringify(value);
            }else{
              this.form[i] = value;
            }
          }
        }
      };
    },
    // 表单重置
    reset() {
      this.form = {
        menuId: undefined,
        parentId: this.parentId,
        menuName: undefined,
        icon: undefined,
        orderNum: undefined,
        isFrame: "1",
        isCache: "0",
        visible: "0",
        status: "0",
        menuType: 'M',
        component: undefined,
        path: undefined,
        query: undefined
      };
      this.resetForm("form");
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          try{
            const data = JSON.parse(JSON.stringify(this.form));
            const query = data.query;
            if(query){
              data.query = JSON.parse(query);
            }
            this.$emit('submit', data);
          }catch{
            this.$modal.msgError("查询参数不是 JSON 类型！");
          }
        }
      });
    }
  },
  watch: {
    parentId() {
      this.form.parentId = this.parentId;
    },
    menu: {
      handler(){
        console.log('change', this.menu);
        this.setMenu();
      },
      immediate: true,
      deep: true
    }
  }
};
</script>
