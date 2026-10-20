<template>
  <span style="margin-left: 5px;">
    <el-button
      circle
      class="like-btn"
      size="mini"
      icon="el-icon-star-on"
      @click="handleAdd()"
      style="color: rgb(196 176 27); "
      v-if="title===''"
    />
    <el-button
      size="mini"
      icon="el-icon-star-on"
      @click="handleAdd()"
      v-else>{{title}}</el-button>
    <el-dialog title="添加快捷菜单" :visible.sync="open" width="680px" append-to-body>
      <el-form :inline="true" style="margin-left: 45px;">
        <el-form-item label="添加至">
          <el-select v-model="addType" placeholder="请选择">
           <el-option
             key="0"
             label="项目菜单"
             value="0">
           </el-option>
           <el-option
             key="1"
             label="全局菜单"
             value="1">
           </el-option>
         </el-select>
        </el-form-item>
        <InputTableSelect style="display: inline-block;" v-if="addType==='0'"
           showColumn="title" label="项目" table="project"
           @selectDone="selectProjectDone"/>
      </el-form>
      <MenuForm :menu="menu" @submit="submit" />
    </el-dialog>
  </span>
</template>

<script>

import MenuForm from "./menuForm.vue";
import { addConfig } from "@/api/system/config";
import {addMenu} from "@/api/system/menu";
import InputTableSelect from "@/components/InputTableSelect/index.vue";

export default {
  components: {InputTableSelect, MenuForm },
  props: {
    title : {
      type : String,
      default : ''
    },
    component : {
      type : String,
      default : undefined
    },
    query : {
      type : Object,
      default : function() { return undefined }
    },
    sty: {
      type: String,
      default: 'circle'
    }
  },
  data() {
    return {
      open: false,
      menu: undefined,
      addType: "0",
      project: undefined
    }
  },
  created() {
  },
  methods: {
    selectProjectDone(project) {
      this.project = project;
    },
    createQuery: function(){
      if(this.query){
        delete this.query['pageNum'];
        delete this.query['pageSize'];
        delete this.query['orderNum'];
        const query = {};
        for(let i in this.query){
          const value = this.query[i];
          if(value && value !==''){
            query[i] = value
          }
        }
        return query
      }else{
        return undefined;
      }
    },
    submit(menu) {
      console.log('创建菜单', menu);
      if(this.addType === '0'){
        if(this.project){
          const form = {
            project: this.project.name,
            configKey: 'menu',
            configName: menu.menuName,
            remark: '项目专属菜单，个性化菜单',
            configType: 'N',
            configValue: JSON.stringify(menu)
          };
          addConfig(form).then(response => {
            this.open = false;
            this.$modal.msgSuccess("新增成功");
          });
        }else{
          this.$modal.msgError("选择项目！");
        }
      }else{
        const query = menu.query;
        if(query){
          menu.query = JSON.stringify(query);
        }
        addMenu(menu).then(response => {
          this.open = false;
          this.$modal.msgSuccess("新增成功！");
        });
      }
    },
    handleAdd() {
      this.menu = {
        component : this.component,
        query: this.createQuery(),
        menuType: 'C'
      }
      console.log(this.menu);
      this.open = true;
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
