<template>
  <div>
    <el-input v-if="selector" v-model="permsModel" placeholder="模糊搜索" readonly>
      <el-button slot="append" @click="showPermisTable" icon="el-icon-search"></el-button>
    </el-input>
    <div v-else>
      <div style="width: 300px;margin-bottom: 10px;">
        <el-input v-model="name" clearable placeholder="请输入权限名称" @clear="filterPerms" @input.native="filterPerms"/>
      </div>
      <el-table v-loading="loading" :data="dataList.slice((pageNum - 1) * pageSize, pageNum * pageSize)" stripe>
        <el-table-column label="权限名称">
          <template slot-scope="scope">
            <div class="name">{{scope.row.name}}</div>
          </template>
        </el-table-column>
        <el-table-column v-for="item in columns" :key="item.prop" :label="item.label" :prop="item.prop" :show-overflow-tooltip="true"/>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="updatePermission(scope.row)"
                v-hasPermi="['system:dict:edit']"
                >编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
          v-show="total>0"
          :total="total"
          :page.sync="pageNum"
          :limit.sync="pageSize"
      />
    </div>
    <el-dialog title="选择权限" :visible.sync="selPerm" width="60%" append-to-body>
      <div style="width: 300px;margin-bottom: 10px;">
        <el-input v-model="name" clearable placeholder="模糊搜索" @clear="filterPerms" @input.native="filterPerms"/>
      </div>
      <el-row v-if="myMultiple" :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="mini"
              @click="selMultiplePermis"
              v-hasPermi="['system:permission:list']"
          >多选</el-button>
        </el-col>
      </el-row>
      <el-table v-loading="loading" :data="dataList.slice((pageNum - 1) * pageSize, pageNum * pageSize)"  @selection-change="handleSelectionChange" stripe>
        <el-table-column v-if="myMultiple" type="selection" width="55" align="center" />
        <el-table-column label="权限名称">
          <template slot-scope="scope">
            <div class="name">{{scope.row.name}}</div>
          </template>
        </el-table-column>
        <el-table-column v-for="item in columns" :key="item.prop" :label="item.label" :prop="item.prop" :show-overflow-tooltip="true"/>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
                type="text"
                @click="selectPermission(scope.row)"
                v-hasPermi="['system:permission:list']"
            >选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
          small
          v-show="total>0"
          :total="total"
          :page.sync="pageNum"
          :limit.sync="pageSize"
      />
    </el-dialog>
    <el-dialog title="编辑权限" :visible.sync="updatePerm">
      <el-form ref="form" :model="permission" :rules="rules" label-width="80px">
        <el-form-item label="权限" prop="name">
          <el-tag type="success">{{permission.name}}</el-tag>
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input v-model="permission.summary" placeholder="请输入摘要说明" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input v-model="permission.desc" rows="4" type="textarea" placeholder="请输入描述说明" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { get_permission } from "@/api/iot/system"
import { addData, updateData } from "@/api/system/dict/data"

export default {
  name: "Permission",
  dicts: ['sys_permission'],
  props: {
    queryId: {
      type: [String, Object],
      default: function (){ return undefined; }
    },
    selector: {
      type: Boolean,
      default: function(){ return true; }
    },
    multiple: {
      type: Boolean,
      default: function(){ return false; }
    }
  },
  data() {
    return {
      loading: false,
      name: '',
      selPerm: false,
      updatePerm: false,
      permsModel: undefined,
      myMultiple : false,
      columns: [],
      dataList: [],
      allPerms: [],
      permission: {},
      // 选中数组
      ids: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      // 表单校验
      rules: {
        summary: [
          { required: true, message: "权限摘要不能为空", trigger: "blur" }
        ],
        desc: [
          { required: true, message: "权限说明不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.myMultiple = this.multiple;
    if(this.queryId){
      this.myMultiple = false;
    }
    this.columns = [
      {label: '路径', prop: 'path'},
      {label: '摘要', prop: 'summary'},
      {label: '描述', prop: 'desc'},
    ],
    this.getList();
  },
  methods: {
    filterPerms() {
      if (this.name) {
        this.dataList = this.allPerms.filter(item => {
          console.log(item);
          return item.name.includes(this.name) ||
            item.desc.includes(this.name) ||
            item.summary.includes(this.name) ||
            item.path.includes(this.name);
        })
      }else{
        this.dataList = this.allPerms;
      }
      this.total = this.dataList.length;
    },
    getList() {
      this.loading = true;
      get_permission().then(response => {
          this.loading = false;
          this.allPerms = this.matchPermission(response.data);
          this.dataList = this.allPerms;
          this.total = this.dataList.length;
        }
      );
    },
    matchPermission(permissionList) {
      const dict = this.dict.type['sys_permission'];
      permissionList.map(permission => {
          const arr = dict.filter(item => { return item.label === permission.name });
          if(arr.length > 0){
            const raw = arr[0].raw;
            permission.summary = raw.dictValue;
            permission.desc = raw.remark;
            permission.dict = raw;
          }
          if(this.queryId && this.queryId === permission.name){
              this.permsModel = permission.summary;
          }
      });
      return permissionList;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection;
    },
    showPermisTable(){
      this.selPerm = true;
    },
    updatePermission(row){
      this.updatePerm = true;
      this.permission = row;
    },
    selMultiplePermis(){
      this.selPerm = false;
      this.$emit("selectDone", this.ids);
    },
    selectPermission(row){
      this.permsModel = row.summary;
      this.$emit("selectDone", row);
      this.selPerm = false;
    },
    cancel() {
      this.updatePerm = false;
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if(this.permission.dict){
            this.permission.dict.dictValue = this.permission.summary;
            this.permission.dict.remark = this.permission.desc;
            updateData(this.permission.dict).then(response => {
              this.updatePerm = false;
              this.$modal.msgSuccess("更新成功！");
            })
          }else{
            const dict = {
              dictSort: 0,
              listClass:"default",
              status: "0",
              dictType:"sys_permission",
              dictLabel : this.permission.name,
              dictValue: this.permission.summary,
              remark: this.permission.desc
            };
            addData(dict).then(response => {
              this.updatePerm = false;
              this.$modal.msgSuccess("创建成功！");
            })
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.name {
  font-weight: bold;
}

</style>
