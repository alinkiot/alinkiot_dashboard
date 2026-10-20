<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>个人信息</span>
          </div>
          <div>
            <div class="text-center">
              <userAvatar :user="user" />
            </div>
            <ul class="list-group list-group-striped">
              <li class="list-group-item">
                <svg-icon icon-class="peoples" /> 用户ID
                <div class="pull-right">{{ user.userId }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="peoples" /> 用户名
                <div class="pull-right">{{ user.userName }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="tree" /> 部门
                <div class="pull-right" v-if="user.dept">{{ user.dept.deptName }} / {{ postGroup }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="peoples" /> 角色
                <div class="pull-right">{{ roleGroup }}</div>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18" :xs="24">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="user" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd :user="user" />
            </el-tab-pane>
            <el-tab-pane label="第三方绑定" name="thirdBind">
              <el-card class="bind-card" shadow="never">
                <div class="bind-item">微信绑定</div>
                <template v-if="user.wechat">
                  <div class="bind-item">登录名：{{user.userName}}</div>
                  <el-button type="info" size="mini"  @click="unBindWechat">解除绑定</el-button>
                </template>
                <div class="bind-item" v-else>
                  <el-button type="primary" size="mini" @click="bindWechat">立即绑定</el-button>
                </div>
              </el-card>
            </el-tab-pane>
          </el-tabs>
      </el-col>
    </el-row>
    <el-dialog
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      title="微信绑定" :visible.sync="bindBox"  width="450px">
        <bindWechat @bindDone="bindWxDone" @onclose="bindBox=false"/>
    </el-dialog>
  </div>
</template>

<script>
import userAvatar from "./userAvatar";
import userInfo from "./userInfo";
import resetPwd from "./resetPwd";
import {wxUnBind, wxBind } from "@/api/iot/wx";
import bindWechat from "@/components/BindWechat";
import { getUserProfile } from "@/api/system/user";
import { siteInfo } from "@/api/login";


export default {
  name: "Profile",
  components: { userAvatar, userInfo, resetPwd, bindWechat },
  data() {
    return {
      user: {},
      roleGroup: {},
      postGroup: {},
      activeTab: "userinfo",
      bindBox: false,
      showBindBox: false
    };
  },
  created() {
    siteInfo().then(res => {
      const loginTypes = res.data.site_login;
      this.showBindBox = loginTypes.includes('wechat_login');
    });
    this.getUser();
  },
  methods: {
    getUser() {
      getUserProfile().then(response => {
        this.user = response.data;
        this.roleGroup = response.roleGroup;
        this.postGroup = response.postGroup;
      });
    },
    bindWechat() {
      this.bindBox = true;
    },
    bindWxDone(data) {
      this.bindBox = false;
      wxBind(data.wechatSession).then(response => {
        this.getUser();
      });
    },
    unBindWechat() {
      this.$modal.confirm('确认解绑？').then(function() {
        return wxUnBind();
      }).then(() => {
        this.getUser();
        this.$modal.msgSuccess("解绑成功");
      }).catch(() => {});
    }
  }
};
</script>
<style lang="scss" scoped>
.pull-right {
  color: #2156a4;
  font-weight: bold;
}

.bind-card {
  width: 400px;
  font-weight: bolder;
  //background-color: #44d7b6;
  //color: white;
}

.bind-item {
  padding: 8px 0;
}

</style>
