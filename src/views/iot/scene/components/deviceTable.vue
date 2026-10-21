<template>
  <div>
    <el-row :gutter="10" class="mb8" v-if="edit">
      <el-col :span="1.5">
        <el-button
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleDevAdd"
            v-hasPermi="['system:device:add']"
        >关联设备</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDevDelete"
            v-hasPermi="['system:device:remove']"
        >解绑设备</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-question"
          size="mini"
          @click="handleSub"
        >数据订阅</el-button>
      </el-col>
    </el-row>
    <DeviceTable
      :size="size"
      :buttons="buttons"
      :selectionMode="edit"
      :queryParams="queryParams"
      @handleEvent="handleEvent"
      @handleSelectionChange="handleSelectionChange"
    />
    <el-dialog title="关联设备" :visible.sync="openDevSelector" >
      <TableSelect table="device" :column="devColumn" @selectDone="selectDeviceDone"></TableSelect>
    </el-dialog>
    <el-dialog title="数据订阅/发布" :visible.sync="openDoc" >
      <TopicBoard :project="scene.project" :scene="scene.id"  />
    </el-dialog>
  </div>
</template>
<script>
import {createObject, delObject, updateObject} from "@/api/iot/table";
import TableSelect from "@/components/TableSelect";
import TopicBoard from "@/views/iot/device/components/topicBoard.vue";
import DeviceTable from "@/views/iot/device/components/deviceTable.vue";

export default {
  dicts: ['sys_normal_disable'],
  components: { DeviceTable, TableSelect, TopicBoard },
  props: {
    scene: {
      type: Object,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    },
    size: {
      type: Array,
      default: function() { return [24, 12, 8, 8, 6] }
    }
  },
  data() {
    return {
      openDoc: false,
      openDevSelector: false,
      devColumn: [],
      tableList: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 选中数组
      ids: [],
      // 总条数
      total: 0,
      // 查询参数
      queryParams: undefined,
      buttons:[
        {
          text: '实时状态',
          event: 'showStatus',
          icon: 'el-icon-view'
        }
      ]
    };
  },
  created() {
    this.devColumn = [
      {label:'设备地址', key:'addr', isSearch: true, regx: true},
      {label:'设备名称', key:'name', isSearch: true, regx: true},
      {label:'创建时间', key:'createTime'}
    ];
    this.getDevList();
  },
  methods: {
    getDevList() {
      if(this.scene && this.scene.id){
        this.queryParams = {
          pageNum: 1,
          pageSize: 10
        },
        this.queryParams.scene = this.scene.id;
        this.queryParams["orderby[desc]"] = "createTime";
      }
    },
    handleDevAdd: function(){
      this.subDevice = { addr: undefined, subAddr: undefined};
      this.openDevSelector = true;
    },
    handleDevDelete: function(){
      delObject('scene_device', this.ids.join(',')).then(response => {
        this.$modal.msgSuccess("解绑成功");
        this.getDevList();
      });
    },
    handleSub: function() {
      this.openDoc = true;
    },
    handleEvent(event, device) {
      if(event === 'showStatus'){
        this.$emit('click', device.id);
      }
    },
    // 多选框选中数据
    handleSelectionChange(obj) {
      const selection = obj.selection;
      this.ids = selection.map(item => item.route);
      this.single = selection.length!==1;
      this.multiple = !selection.length;
      this.tableList = obj.tableList;
    },
    selectDeviceDone: function(device){
      const device1 = { id : device.id, project : this.scene.project };
      updateObject('device', device1).then(res => {
        const data = {
          device : device.id,
          scene: this.scene.id
        };
        createObject('scene_device', data).then(res => {
          this.openDevSelector = false;
          this.getDevList();
          this.$modal.msgSuccess("绑定成功");
        });
      });
    },

  },
  watch: {
    scene() {
      this.getDevList();
    }
  }
};
</script>
<style>

</style>
