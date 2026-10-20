<template>
  <div class="app-container">
    <div class="title-bar" v-if="dictCategory">
      <span class="title-bar__name">字典：{{dictCategory.dictName}}</span>
      <div class="title-bar__actions">
        <el-button
          size="small"
          icon="el-icon-back"
          @click="handleClose"
        >返回</el-button>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="handleAdd"
          v-hasPermi="['system:dict:add']"
        >新增</el-button>
      </div>
    </div>
    <DictTable :buttons="buttons" :dictType="dictType" @click="handleClick" :refresh="refresh" :showToolbar="showToolbar" />
    <DictDialog :open="open" :dictType="dictType" :dictCode="dictCode" @change="onChange" />
  </div>
</template>

<script>
import { delData } from "@/api/system/dict/data";
import DictDialog from "./components/dictDialog.vue";
import DictTable from "./components/dictTable.vue";

export default {
  name: "Data",
  components:{ DictDialog, DictTable },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      dictCategory: undefined,
      open: false,
      dictCode: undefined,
      dictType: undefined,
      refresh: false,
      showToolbar: true,
      buttons: [
        {key: 'edit', title: '修改', icon: 'el-icon-edit'},
        {key: 'remove', title: '删除', icon: 'el-icon-delete'}
      ]
    };
  },
  created() {
    this.dictType = this.$route.params && this.$route.params.dictType;
    if(!this.dictType){
      this.dictType = this.$route.query.dictType;
      this.showToolbar = false;
    }
  },
  methods: {
    onChange(dictCategory) {
      this.dictCategory = dictCategory;
      this.refresh = !this.refresh;
    },
    /** 返回按钮操作 */
    handleClose() {
      const project = this.$route.params.project
      if(project){
        this.$tab.closeOpenPage({ path: "/" + project + "/system/dict" });
      }else{
        this.$tab.closeOpenPage({ path: "/system/dict" });
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.dictCode = undefined;
      this.open = !this.open;
    },
    handleClick(button, row){
      if(button.key ==='edit'){
        this.dictCode = row.dictCode || this.ids
        this.open = !this.open;
      } else if(button.key === 'remove'){
        const dictCodes = row.dictCode || this.ids;
        this.$modal.confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？').then(function() {
          return delData(dictCodes);
        }).then(() => {
          this.refresh = !this.refresh;
          this.$modal.msgSuccess("删除成功");
          this.$store.dispatch('dict/removeDict', this.queryParams.dictType);
        }).catch(() => {});
      }
    }
  }
};
</script>

<style lang="scss" scoped>

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);

  &__name {
    font-weight: 600;
    font-size: 16px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

</style>
