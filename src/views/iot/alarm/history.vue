<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item v-for="item in column" v-if="item.isSearch" :key="item.key" :label="item.label" :prop="item.key">
        <el-input v-model="item.value" :placeholder="item.label" clearable/>
      </el-form-item>
      <InputTableSelect  showColumn="name" label="设备名称" table="device" @selectDone="selectDeviceDone" prop="device"/>
      <el-form-item label="处理状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="处理状态" clearable>
          <el-option
              v-for="dict in dict.type.sys_handle_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
            v-model="dateRange"
            class="timePicker"
            value-format="yyyy-MM-dd HH:mm:ss"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="danger"

            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:alarm:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :table="table" :showSearch.sync="showSearch" @queryTable="getList" @download="handleExport"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column align="center" v-for="item in column" :key="item.key" :label="item.label" :prop="item.key" :width="item.width" :min-width="item.minWidth" show-overflow-tooltip />
      <el-table-column label="设备" align="center" prop="device" :formatter="formatRow" width="120" show-overflow-tooltip />
      <el-table-column label="类型" align="center" prop="type" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_rule_type" :value="scope.row.type"/>
        </template>
      </el-table-column>
      <el-table-column label="等级" align="center" prop="level" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_level" :value="scope.row.level"/>
        </template>
      </el-table-column>
      <el-table-column label="内容" align="left" header-align="center" prop="content" :formatter="formatRow" min-width="220" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="165">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_handle_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="110">
        <template slot-scope="scope">
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="openAlarmDialog(scope.row)"
          >处理</el-button>
          <el-button
              size="mini"
              type="text"
              style="color:red;"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:alarm:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
    />
    <el-dialog title="报警处理" :visible.sync="openAlarm" width="550px" >
      <el-form :model="mess">
        <div class="alarm-box"><span>设备：</span>{{ mess.device}}</div>
        <div class="alarm-box"><span>位置：</span>{{ mess.location}}</div>
        <div class="alarm-box"><span>状态：</span>{{ mess.status}}</div>
        <div class="alarm-box"><span>时间：</span>{{ parseTime(mess.time) }}</div>
        <div class="alarm-remark">
          <p v-for="item in mess.remark">{{item}}</p>
        </div>
        <el-form-item label="处理意见" prop="content">
          <el-input v-model="alarm.message" rows=4 type="textarea" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="handleAlarm">处理</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, updateObject } from "@/api/iot/table";

export default {
  name: "Project",
  dicts: ['sys_handle_status', 'iot_level', 'iot_rule_type'],
  components: {
    InputTableSelect
  },
  data() {
    return {
      table: 'alarm',
      desc: '历史告警',
      openAlarm: false,
      alarm: {  },
      mess: {},
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      dateRange: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      column: [],
      rules: [],
      device: undefined,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      }
    };
  },
  created() {
    this.column = [
      // {label:'ID', key:'id', width:70},
      {label:'告警名称', key:'title', isSearch: true, minWidth: 140},
    ];
    const status = this.$route.query.status;
    if(status !== undefined){
      this.queryParams.status = status;
    }
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      if(this.dateRange && this.dateRange.length === 2){
        this.queryParams["createTime[begin]"] = this.dateRange[0];
        this.queryParams["createTime[end]"] = this.dateRange[1];
      }else{
        this.queryParams["createTime[begin]"] = undefined;
        this.queryParams["createTime[end]"] = undefined;
      }
      this.queryParams["orderBy[desc]"] = 'createTime';
      queryObject(this.table, this.queryParams).then(response => {
        const rows = response.rows;
        const total = response.total;
        const ids = [];
        rows.map(row => {
          if(row.rule && !ids.includes(row.rule)){
            ids.push(row.rule);
          }
        });
        if(ids.length > 0){
          getObject('rule', ids.join(',')).then(response => {
            const rules = response.data;
            if(Array.isArray(rules)){
              this.rules = rules;
            }else{
              this.rules.push(rules)
            }
            this.tableList = rows;
            this.total = total;
            this.loading = false;
          });
        }else{
          this.tableList = rows;
          this.total = total;
          this.loading = false;
        }
      });
    },
    selectDeviceDone(device) {
      if(device){
        this.device = device;
        this.queryParams.addr = device.addr;
      }else{
        this.device = undefined;
        this.queryParams.addr = undefined;
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.column.filter(item => {
        if(item.isSearch){
          if(item.value && item !== ''){
            this.queryParams[item.key] = item.value;
          }else{
            this.queryParams[item.key] = undefined;
          }
        }
      });
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    openAlarmDialog(row) {
      this.openAlarm = true;
      this.alarm = row;
      this.mess = this.formatContent(row);
    },
    formatContent(row) {
      const txt = JSON.parse(row['content'].replace(/[\r|\n|\t]/g, "|"));
      const remark = txt.remark.split('|');
      txt['remark'] = remark;
      return txt;
    },
    handleAlarm(){
      const data = {
        id : this.alarm.id,
        status : '1',
        message : this.alarm.message
      };
      updateObject(this.table, data).then(response =>{
        this.$modal.msgSuccess("处理成功");
        this.getList();
        this.openAlarm = false;
      });
    },
    cancel() {
      this.openAlarm = false;
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const table = this.table;
      this.$modal.confirm('是否确认删除'+this.desc+'ID为"' + ids + '"的数据项？').then(function() {
        return delObject(table, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/export/'+ this.table, {
        ...this.queryParams
      }, this.desc+`_${new Date().getTime()}.xlsx`)
    },
    formatRow: function(row, column){
      const txt = this.formatContent(row);
      switch (column.property){
        case 'device':
          return txt.device;
        case 'content':
          return txt.remark[5];
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.alarm-box {
  margin-bottom: 12px;
  border-bottom: 1px solid silver;
  padding-bottom: 5px;

  span {
    font-weight: bolder;
    font-size: 17px;
  }
}

.alarm-remark {
  padding: 5px 8px;
  border-radius: 8px;
  p {
    margin: 0px;
    padding: 3px;
  }
}


.timePicker {
  width: 100%;
}
@media screen and (min-width: 1100px){
  .timePicker {
    width: 350px;
  }
}

</style>
