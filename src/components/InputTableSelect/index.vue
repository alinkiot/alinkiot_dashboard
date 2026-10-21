<template>
  <span>
    <el-form-item :label="label" :prop="prop" v-if="!multiple">
      <el-tag v-if="read && title === ''" type="danger">未绑定</el-tag>
      <el-tag v-else-if="read">{{title}}</el-tag>
      <el-input v-model="title" readonly v-bind:placeholder="getPlaceholder()" v-else>
        <el-button class="btn" @click="handleSelect" slot="append" icon="el-icon-thumb"></el-button>
        <el-button class="btn" @click="handleClean" slot="append" icon="el-icon-circle-close"></el-button>
      </el-input>
    </el-form-item>
    <el-card shadow="never" v-else>
        <div slot="header" class="clearfix">
          <span>{{label}}: </span>
          <el-button v-if="!read" type="primary" class="new-tag" :disable-transitions="false" size="small" @click="handleSelect" slot="append" icon="el-icon-plus">添加</el-button>
          <el-button v-if="!read" type="danger" class="new-tag" :disable-transitions="false" size="small" @click="handleDelete" slot="append" icon="el-icon-delete">清空</el-button>
        </div>
        <div v-if="session.length>0">
          <el-tag v-for="item in session" :key="item.id" closable @close="handleClose(item)" style="margin: 5px;">
          {{getTitle(item)}}
        </el-tag>
        </div>
        <el-empty v-else />
    </el-card>
    <el-dialog v-bind:title="getPlaceholder()" :visible.sync="openSelector" append-to-body>
      <TableSelect :table="table" :column="myColumn" :multiple="multiple" @selectDone="selectDone" :showSearch="showSearch"></TableSelect>
    </el-dialog>
  </span>
</template>
<script>
import TableSelect from '@/components/TableSelect'
import {getObject} from "@/api/iot/table";

export default {
  components: {
    TableSelect
  },
  props: {
    queryId: {
      type: [Number, String, Object],
      default: function (){ return undefined; }
    },
    queryParams: {
      type: Object,
      default: function() { return undefined }
    },
    table: {
      type: String,
      required: true
    },
    column: {
      type: Array,
      default: function (){ return []}
    },
    prop: {
      type: String
    },
    label: {
      type: String,
      required: false,
      default: ''
    },
    showColumn: {
      type: String,
      required: true
    },
    multiple: {
      type: Boolean,
      default: false
    },
    read:{
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      myColumn:[],
      item: undefined,
      dialogTitle: '',
      openSelector: false,
      title: '',
      session: [], // 多选
      showSearch: true
    };
  },
  created() {
    this.dialogTitle = '选择' + this.label;
  },
  methods: {
    handleDelete() {
      this.session = [];
    },
    handleClose(item) {
      this.session = this.session.filter(i => {
        return i.id !== item.id
      });
    },
    getPlaceholder() {
      return '请选择' + this.label;
    },
    createColumn() {
      this.myColumn = this.column;
      if(this.column.length === 0){
        switch (this.table){
          case "project":
            this.myColumn = [
              {label:'项目ID', key:'id'},
              {label:'项目标识', key:'name', isSearch: true, regx: true},
              {label:'项目名称', key:'title', isSearch: true, regx: true},
              {label:'所属公司', key:'company', isSearch: true, regx: true}
            ];
            break;
          case "scene":
            this.myColumn = [
              {label:'ID', key:'id'},
              {label:'场景名称', key:'title', isSearch: true, regx: true},
              {label:'备注', key:'remark'},
              {label:'创建时间', key:'createTime'}
            ];
            break;
          case "product":
            this.myColumn = [
              {label:'产品ID', key:'id'},
              {label:'产品名称', key:'name', isSearch: true, regx: true},
              {label:'创建时间', key:'createTime'}
            ];
            break;
          case "sceneDevice":
            this.myColumn = [
              {label:'设备名称', key:'name'},
              {label:'设备地址', key:'addr'},
              {label:'创建时间', key:'createTime'}
            ];
            break;
          case "device":
            this.myColumn = [
              {label:'设备名称', key:'name', isSearch: true, regx: true},
              {label:'设备地址', key:'addr', isSearch: true, regx: true},
              {label:'创建时间', key:'createTime'}
            ];
            break;
          case "user":
            this.myColumn = [
              {label:'用户ID', key:'userId'},
              {label:'用户名称', key:'userName', isSearch: true, regx: true},
              {label:'昵称', key:'nickName', isSearch: true, regx: true}
            ];
            break;
          case "group":
            this.myColumn = [
              {label:'群组ID', key:'id'},
              {label:'群组名称', key:'name', isSearch: true, regx: true}
            ];
            break;
          case "config":
            this.showSearch = false;
            this.myColumn = [
              {label:'参数名称', key:'configName'},
              {label:'参数说明', key:'remark'}
            ];
            break;
          default:
            this.myColumn = [
              {label:'ID', key:'id'}
            ];
            break;
        }
      }
    },
    queryObject() {
      this.title = '';
      if(this.queryId){
        getObject(this.table, this.queryId).then(response => {
          const data = response && response.data;
          // 查询的对象可能已不存在（后端返回 null/空），此时不要抛错导致页面无法渲染
          const item = (data && !Array.isArray(data)) ? data : (Array.isArray(data) ? data[0] : undefined);
          this.item = item;
          this.title = this.getTitle(item);
          this.$emit("selectDone", item);
        }).catch(() => {
          this.item = undefined;
          this.title = '';
          this.$emit("selectDone", undefined);
        });
      }
      for( let key in this.queryParams){
        this.myColumn.push({ key : key, default : this.queryParams[key], hidden:true })
      }
    },
    selectDone(row) {
      this.openSelector = false;
      if(!this.multiple){
        this.title = row[this.showColumn];
        this.$emit("selectDone", row);
      }else{
        this.session = row;
        this.$emit("selectDone", row);
      }
    },

    getTitle(item) {
      if(!item){
        return '';
      }
      return item[this.showColumn];
    },

    handleSelect() {
      this.openSelector = true;
    },
    handleClean() {
      this.title = '';
      this.$emit("selectDone", undefined);
    }
  },
  watch: {
    table: {
      immediate: true,
      handler(val){
        this.createColumn();
      }
    },
    queryId: {
      immediate: true,
      handler(val) {
        if(val){
          this.queryObject();
        }else{
          this.title = '';
          this.item = undefined
        }
      }
    },
    queryParams: {
      deep: true,
      immediate: true,
      handler(val) {
        this.createColumn();
        if(val){
          this.queryObject();
        }else{
          this.title = '';
          this.item = undefined
        }
      }
    }
  }
};
</script>
<style lang="scss" scoped>
  .btn {
    padding: 10px;
  }
  .btn:hover{
    color: #0071e3;
  }
  .new-tag {
    margin-left: 10px;
    height: 28px;
    line-height: 26px;
    padding-top: 0;
    padding-bottom: 0;
  }
</style>
