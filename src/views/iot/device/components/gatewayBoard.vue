<template>
  <div v-loading="loading">
    <el-card class="gateway-card" shadow="hover" v-if="gateway">
      <div slot="header" class="gateway-card__header">
        <span class="gateway-card__title">
          <i class="el-icon-connection gateway-card__icon"></i>
          {{ gateway.name }}
        </span>
        <el-button @click="goDevice" type="text" icon="el-icon-arrow-right">详情</el-button>
      </div>
      <el-descriptions :column="1" size="small" border>
        <el-descriptions-item label="从站地址">{{ gateway.subAddr || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备地址">{{ gateway.addr || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备位置">{{ gateway.location || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    <el-empty description="未找到网关" v-else/>
  </div>
</template>
<script>
import { getGateway } from '@/api/iot/table'
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
    }
  },
  data() {
    return {
      loading: false,
      gateway: undefined
    };
  },
  created() {
    this.loading = true;
    getGateway(this.device.addr).then(device => {
      this.loading = false;
      this.gateway = device
    });
  },
  methods: {
    goDevice() {
      let backURL = '/device/deviceEdit?id=' + this.device.id;
      let path = '/device/deviceEdit';
      const project = this.$route.params.project;
      if(project){
        path = '/' + project + path;
        backURL = '/'+ project + backURL;
      }
      this.$router.push({
        path: path,
        query: {id: this.gateway.id, redirect: backURL}
      });
    }
  }
};
</script>
<style lang="scss" scoped>

.gateway-card {
  width: 360px;
  border-radius: 8px;
  transition: box-shadow .2s ease;

  ::v-deep .el-card__header {
    padding: 12px 16px;
  }

  ::v-deep .el-card__body {
    padding: 16px;
  }
}

.gateway-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gateway-card__title {
  font-weight: bold;
  font-size: 15px;
  display: flex;
  align-items: center;
}

.gateway-card__icon {
  margin-right: 6px;
  color: #409EFF;
  font-size: 17px;
}

</style>

<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .gateway-card {
    .el-descriptions__body {
      background-color: transparent !important;
      color: rgba(255, 255, 255, 0.75) !important;
    }
    .el-descriptions-item__label.is-bordered-label {
      background: rgba(255, 255, 255, 0.05) !important;
      color: rgba(255, 255, 255, 0.5) !important;
    }
    .is-bordered .el-descriptions-item__cell {
      border-color: rgba(255, 255, 255, 0.08) !important;
    }
  }
}
</style>
