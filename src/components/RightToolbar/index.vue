<template>
  <div class="top-right-btn" :style="style">
    <el-row>
      <el-tooltip class="item" effect="dark" :content="showType === 'table' ? '表格展示' : '卡片展示'" placement="top" v-if="showType !==''">
        <el-button size="mini" circle icon="el-icon-postcard" @click="changeShowMode()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top" v-if="search">
        <el-button size="mini" circle icon="el-icon-search" @click="toggleSearch()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="导出文件" placement="top" v-if="showDownload">
        <el-button size="mini" circle icon="el-icon-download" @click="downloadFile()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="批量导入" placement="top" v-if="showImport">
        <el-button size="mini" circle icon="el-icon-upload" @click="handleImport()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="保存此查询到菜单，方便直接进入" placement="top" v-hasPermi="['system:config:add']" v-if="component">
        <MenuDlg :component="component" :query='menuQuery' />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="自动刷新" placement="top">
        <el-dropdown placement="bottom">
          <span class="el-dropdown-link">
            <el-button slot="reference" size="mini" circle :icon="icon" style="margin-left: 8px;"/>
          </span>
          <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-for="item in seconds" :key="item.label"
                @click.native="refresh(item)">
                <i v-if="item.value === second"  class="el-icon-loading"></i>
                <i v-else  class="el-icon-timer"></i>
                {{item.label}}
              </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="显隐列" placement="top" v-if="columns.length > 0">
        <el-popover
          placement="bottom-start"
          trigger="click">
          <div>
            <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
            <el-checkbox-group v-model="checkedColumns" @change="handleCheckedColumnsChange" style="overflow: auto;  max-height: 400px;">
              <el-checkbox v-for="item in columns" :label="item.label" :key="item.key" style="padding-right: 15px;">
                {{item.label}}
              </el-checkbox>
            </el-checkbox-group>
          </div>
          <el-button slot="reference" size="mini" circle icon="el-icon-menu" style="margin-left: 8px;"/>
        </el-popover>
      </el-tooltip>
    </el-row>
    <el-dialog :title="upload.title" :visible.sync="upload.open" width="400px" append-to-body>
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否覆盖已经存在的数据
          </div>
          <span>仅允许导入xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { getToken } from "@/utils/auth";
import { importData } from "@/api/iot/table";
import MenuDlg from "@/views/system/menu/components/menuDlg.vue";

export default {
  name: "RightToolbar",
  components: {
    MenuDlg
  },
  data() {
    return {
      isIndeterminate: true,
      checkedColumns: [],
      checkAll: true,

      // 弹出层标题
      title: "显示/隐藏",
      // 是否显示弹出层
      open: false,
      // 更新时间，默认5秒
      second : undefined,
      seconds : [
        {label: '5秒刷新', value : 5000},
        {label: '10秒刷新', value : 10000},
        {label: '15秒刷新', value : 15000}
      ],
      timer : undefined,
      icon : 'el-icon-refresh',

      // 用户导入参数
      upload: {
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/upload"
      }
    };
  },
  props: {
    component : {
      type : String,
      default : undefined
    },
    menuQuery : {
      type : Object,
      default : undefined
    },
    showType : {
      type : String,
      default : ''
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    showDownload: {
      type: Boolean,
      default: false,
    },
    showImport: {
      type: Boolean,
      default: false,
    },
    table: {
      type: String
    },
    columns: {
      type: Array,
      default: function (){ return []; }
    },
    search: {
      type: Boolean,
      default: true,
    },
    gutter: {
      type: Number,
      default: 10,
    },
  },
  computed: {
    style() {
      const ret = { marginBottom : '5px', marginTop: '5px' };
      if (this.gutter) {
        ret.marginRight = `${this.gutter / 2}px`;
      }
      return ret;
    }
  },
  mounted() {
    // 显隐列初始默认隐藏列
    const fields = this.$route.query.fields;
    const defFields = fields ? fields.split(',') : []
    this.columns.map(column => {
      if(defFields.length > 0){
        if(defFields.includes(column.key)){
          column.visible = true;
          this.checkedColumns.push(column.label);
        }else{
          column.visible = false;
        }
      }else if (column.visible !== false) {
        this.checkedColumns.push(column.label);
      }
    })
    this.checkAll = this.checkedColumns.length === this.columns.length
  },
  methods: {
    // 搜索
    toggleSearch() {
      this.$emit("update:showSearch", !this.showSearch);
    },
    changeShowMode() {
      const mode = this.showType === 'table' ? 'card' : 'table';
      this.$emit("update:showType", mode);
    },
    // 刷新
    refresh(item) {
      let clean = false;
      if(this.timer){
        this.icon = 'el-icon-refresh';
        clearInterval(this.timer);
        this.timer = undefined;
        clean = true;
      }
      if(!this.second ||  (this.second !== undefined && item.value !== this.second)){
        this.second = item.value;
        this.icon = 'el-icon-loading';
        const that = this;
        this.timer = setInterval(function (){
          that.$emit("queryTable");
        }, this.second);
      }else{
        this.second = undefined;
      }
    },
    //下载
    downloadFile() {
      this.$emit("download");
    },
    handleCheckAllChange(val) {
      this.columns.map(item => {
        item.visible = val;
        if(val && this.checkedColumns.indexOf(item.label) === -1){
          this.checkedColumns.push(item.label);
        }
      })
      if(!val){
        this.checkedColumns = [];
      }
      this.isIndeterminate = false;
      if(this.menuQuery){
        this.menuQuery.fields = undefined
      }
    },
    handleCheckedColumnsChange(value) {
      const fields = []
      this.columns.map(item =>{
          item.visible = value.indexOf(item.label) > -1;
          if(item.visible){
            fields.push(item.key)
          }
      });
      let checkedCount = value.length;
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.columns.length;
      this.checkAll = this.checkedColumns.length === this.columns.length
      if(this.component){
        if(!this.checkAll){
          this.menuQuery.fields = fields.join(',');
        }else{
          this.menuQuery.fields = undefined
        }
      }
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "批量导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('system/importTemplate?table=' + this.table, {
      }, `template_${new Date().getTime()}.csv`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      const data = response;
      data['updateSupport'] = this.upload.updateSupport;
      importData(this.table, response).then(res => {
        this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + res.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      });
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    }
  },
};
</script>
<style lang="scss" scoped>
::v-deep .el-transfer__button {
  border-radius: 50%;
  padding: 12px;
  display: block;
  margin-left: 0px;
}
::v-deep .el-dialog__body{
  padding:10px 20px 20px 20px;
}
::v-deep .el-transfer__button:first-child {
  margin-bottom: 10px;
}
::v-deep .el-checkbox{
  display: block;
  margin: 5px;
}
::v-deep .el-radio{
  display: block;
  margin: 5px;
}
</style>
