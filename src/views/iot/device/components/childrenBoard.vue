<template>
  <div>
    <el-row>
      <el-col>
        <el-row :gutter="10" style="margin-bottom: 10px;">
          <el-col :span="1.5">
            <el-button
              type="primary"

              icon="el-icon-plus"
              size="mini"
              @click="handleSubAdd"
              v-hasPermi="['system:sub_device:add']"
            >绑定</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="mini"
              :disabled="selectionMode && multiple"
              @click="handleSubDelete"
              v-hasPermi="['system:sub_device:remove']"
            >解绑{{ selectionMode && ids.length > 0 ? `(${ids.length})` : '' }}</el-button>
          </el-col>
          <el-col :span="1.5" v-if="selectionMode">
            <el-button
              size="mini"
              @click="cancelSelection"
            >取消</el-button>
          </el-col>
        </el-row>
        <DeviceTable
          :queryParams="queryParams"
          :columns="columns"
          :buttons="buttons"
          :refresh="refresh"
          :selectionMode="selectionMode"
          @handleEvent="handleEvent"
          @handleSelectionChange="handleSelectionChange"
        />
      </el-col>
    </el-row>
    <el-dialog title="添加子设备" :visible.sync="openSubSelector" width="550px">
      <el-form ref="subForm" :model="subDevice" :rules="subRules" :inline=true label-width="150px">
        <el-form-item label="从站地址(0x)" prop="subAddr">
          <el-input v-model="subDevice.subAddr" placeholder="请输入从站地址"/>
        </el-form-item>
        <InputTableSelect showColumn="name" label="设备名称" table="device" @selectDone="selectDeviceDone" prop="subDev"/>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="addDeviceDone">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="配置子设备" :visible.sync="openSetSelector"  width="550px">
      <el-form ref="setForm" :model="subDevice" :rules="subRules" :inline=true label-width="150px">
        <el-form-item label="波特率" prop="baud">
          <el-select v-model="baud" placeholder="请选择波特率">
            <el-option
              v-for="item in bauds"
              :key="item"
              :label="item"
              :value="item">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>
<script>
import {createObject, delObject, queryObject} from '@/api/iot/table'
import InputTableSelect from "@/components/InputTableSelect/index.vue";
import DeviceTable from "./deviceTable.vue"

export default {
  components: {
    DeviceTable,
    InputTableSelect
  },
  props: {
    device: {
      type: Object,
      default: function(){
        return undefined;
      }
    },
    product: {
      type: Object,
      default: function(){
        return undefined;
      }
    }
  },
  data() {
    const validateCheck = (rule, value, callback) => {
      let self = rule.self;
      // 检查是否已通过 InputTableSelect 选中了子设备（addr 被赋值说明已选）
      if (!(self.subDevice && self.subDevice.addr)) {
        callback(new Error('子设备不能为空'));
      } else {
        callback();
      }
    };
    return {
      loading: false,
      selectionMode: false,
      baud: 9600,
      bauds:[2400,4800,9600,19200,38400,115200],
      tableList: [],
      // 选中数组
      ids: [],
      // 总条数
      total: 0,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      refresh: false,
      buttons: [
        {
          text: '详情',
          event: 'goEdit',
          icon: 'el-icon-info',
          permission: "['system:device:edit']"
        },
        // {
        //   text: '子配置',
        //   event: 'setting',
        //   icon: 'el-icon-setting',
        //   permission: "['system:device:edit']"
        // }
      ],
      columns:[
        {key: 'name', label:'设备名称', visible:true},
        {key: 'addr', label:'设备地址', visible:true},
        {key: 'product', label:'所属产品', visible:true},
        {key: 'project', label:'所属项目', visible:true},
        {key: 'online', label:'在线状态', visible:true},
        {key: 'status', label:'是否启用', visible:true},
        {key: 'netType', label:'协议类型', visible:true}
      ],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      openSubSelector: false,
      openSetSelector: false,
      subDevice: { addr: undefined, subAddr: undefined},
      subRules: {
        subAddr: [
          {required: true, message: "从站地址不能为空", trigger: "blur"}
        ],
        subDev: [
          {self: this,  validator: validateCheck, required: true, message: "子设备不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.queryParams.gateway = this.device.addr;
    this.queryParams["orderBy[asc]"] = "subAddr";
  },
  methods: {
    handleSubAdd: function(){
      this.openSubSelector = true;
      this.subDevice = {  addr: undefined, subAddr: undefined};
    },
    handleSubDelete: function(){
      if (!this.selectionMode) {
        this.selectionMode = true;
        return;
      }
      this.$modal.confirm('确认解绑选中的设备？').then(() => {
        delObject('sub_device', this.ids.join(',')).then(response => {
          this.$modal.msgSuccess("解绑成功");
          this.selectionMode = false;
          this.ids = [];
          this.multiple = true;
          this.refresh = !this.refresh;
        });
      }).catch(() => {});
    },
    cancelSelection: function(){
      this.selectionMode = false;
      this.ids = [];
      this.multiple = true;
    },
    handleEvent(event, row) {
      if(event === 'goEdit'){
        let backURL = '/device/deviceEdit?id=' + this.$route.query.id;
        let path = '/device/deviceEdit';
        const project = this.$route.params.project;
        if(project){
          path = '/' + project + path;
          backURL = '/'+ project + backURL;
        }
        // 跳转设备编辑页
        this.$router.push({
          path: path,
          query: {id: row.id, redirect: backURL}
        });
      } else if(event === 'setting'){
        console.log(row);
        this.openSetSelector = true;
      }
    },
    // 多选框选中数据
    handleSelectionChange(obj) {
      const selection = obj.selection;
      this.ids = selection.map(item => item.subDevId);
      this.single = selection.length!==1;
      this.multiple = !selection.length;
      this.tableList = obj.tableList;
    },
    addDeviceDone: function(){
      this.$refs["subForm"].validate(valid => {
        if(valid){
          const query = {
            gateway: this.device.addr,
            subAddr: this.subDevice.subAddr
          };
          queryObject('sub_device', query).then(response => {
            const count = response.data.length;
            if(count > 0){
              this.$modal.msgWarning("从站地址已经存在！");
            }else{
              createObject('sub_device', this.subDevice).then(response => {
                this.openSubSelector = false;
                this.refresh = !this.refresh;
                this.$modal.msgSuccess("新增成功");
              });
            }
          })
        }
      });
    },
    selectDeviceDone: function(subDevice){
      // 无论 subAddr 是否已填，只要选了设备就先把 addr 赋上，
      // 提交时再一并校验 subAddr，避免选设备顺序不同导致 addr 丢失
      this.subDevice.gateway = this.device.addr;
      this.subDevice.addr = subDevice.addr;
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
