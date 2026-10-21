<template>
  <div class="header-msgbox">
    <el-badge is-dot :value="count" :hidden="!hasMsg" :max="99" class="badge-item">
      <i class="msgbox-icon el-icon-bell" @click.stop="click"></i>
    </el-badge>
    <MqttBoard @doMqttMessage="doMqttMessage" :subscription="subscription"/>
    <el-dialog title="消息列表" :visible.sync="showBox" append-to-body>
      <el-table :data="tableList" style="width: 100%;" v-loading="loading">
        <el-table-column
            prop="level"
            align="center"
            label="级别">
          <template slot-scope="scope">
            <i v-if="scope.row.level === 'warning'" style="color:#ffba00;" class="el-icon-warning">告警</i>
            <i v-else-if="scope.row.level === 'error'" style="color:#ff0000;" class="el-icon-error">错误</i>
            <i v-else class="el-icon-info" style="color:#2156a4;">提示</i>
          </template>
        </el-table-column>
        <el-table-column
            prop="msg"
            align="center"
            label="内容">
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template slot-scope="scope">
            <el-button
                type="text"
                size="mini"
                @click="handleMsg(scope.row)"
            >前往处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>

import MqttBoard from "@/components/MqttBoard";
import { queryObject } from "@/api/iot/table";
import { listNotice } from "@/api/system/notice";
import store from "@/store";


export default {
  name: 'HeaderMsgBox',
  components: { MqttBoard },
  data() {
    return {
      loading: false,
      hasMsg: false,
      count: 0,
      showBox: false,
      subscription: {
        topic: 'p/system/' + store.getters.name,
        qos: 0
      },
      tableList: []
    }
  },
  mounted() {
    this.queryAlarm();
    this.queryNotice();
  },
  methods: {
    addMsg(level, title, msg, href) {
      this.count = this.count + 1;
      this.hasMsg = this.count > 0;
      this.tableList.push({
        level : level,
        msg : msg,
        href : href
      });
    },
    queryNotice() {
      const query = { pageNum: 1, pageSize: 5, status : "0"};
      listNotice(query).then(response => {
        const total = response.total;
        if(total > 0){
          const msg = '您有' + total + '条公告还未处理！';
          this.addMsg('info', '告警', msg, '/system/notice');
        }
      })
    },
    queryAlarm() {
      const query = { status : 0, pageNum : 1, pageSize: 5 };
      query['orderBy[desc]'] = 'createTime';
      queryObject('alarm', query).then(response => {
        const total = response.total;
        if(total > 0){
          const msg = '您有' + total + '条告警还未处理！';
          this.addMsg('warning', '告警', msg, '/alarm/alarmHistory');
        }
      });
    },
    click() {
      this.tableList = [];
      this.count = 0;
      this.queryAlarm();
      this.queryNotice();
      this.showBox = true;
    },

    getPath(path) {
      if(this.$route.params.project){
        return '/' + this.$route.params.project +  path
      }
      return path;
    },
    handleMsg(row) {
      this.showBox = false;
      this.$router.push({
        path: this.getPath(row.href + '?status = 0')
      });
    },
    doMqttMessage(topic, message){
      const data = JSON.parse(message);
      // console.log(data);
      if(data.alert_level){
        const msg = data.device + '发生了' +  data.alert_level + ',' + data.status;
        this.$notify({
          title: data.alert_level,
          dangerouslyUseHTMLString: true,
          message: msg,
          type: 'warning'
        });
      }
      if(data.title){
        const msg = data.device + ':' + data.status;
        this.$notify({
          title: data.title,
          dangerouslyUseHTMLString: true,
          message: msg,
          type: 'success'
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.header-msgbox {
  .msgbox-icon {
    cursor: pointer;
    font-size: 23px;
    vertical-align: top;
    font-weight: bold;
  }
  .badge-item {
    margin-top: 13px;
  }
}
::v-deep .el-table th{
  padding: 0px;
}
::v-deep .el-dialog__body{
  padding: 0px 15px 15px 15px;
}

</style>
