<template>
  <div v-if="queryParams" v-loading="loading">
    <div v-if="tableList.length > 0">
      <el-row :gutter="16" v-if="showType==='card'">
        <el-col :xs="size[0]" :sm="size[1]" :md="size[2]" :lg="size[3]" :xl="size[4]" v-for="device in tableList" :key="device.addr" style="margin-bottom: 16px;">
          <div class="device-card" :class="{'device-card--offline': device.online !== 1, 'device-card--disabled': device.status === '1'}">
            <div class="device-card__status-bar" :class="device.online === 1 ? 'status-online' : 'status-offline'"></div>
            <div class="device-card__header">
              <div class="device-card__header-left">
                <el-checkbox v-if="selectionMode" @change="checked => handleCardSelectionChange(checked, device)" />
                <span class="device-card__name">{{ device.name }}</span>
              </div>
              <div class="device-card__header-right">
                <span class="device-card__online-dot" :class="device.online === 1 ? 'dot-online' : 'dot-offline'"></span>
                <el-tooltip v-if="device.lastOnline && device.product.category !== 'ezviz'" effect="dark"
                            :content="'上线时间：'+parseTime(device.lastOnline)" placement="bottom">
                  <span class="device-card__online-text" :class="device.online === 1 ? 'text-online' : 'text-offline'">
                    {{ device.online === 1 ? '在线' : '离线' }}
                  </span>
                </el-tooltip>
                <span v-else-if="device.product.category !== 'ezviz'" class="device-card__online-text" :class="device.online === 1 ? 'text-online' : 'text-offline'">
                  {{ device.online === 1 ? '在线' : '离线' }}
                </span>
              </div>
            </div>
            <div class="device-card__body">
              <div class="device-card__image">
                <ImagePreview :src="device.product.img" v-if="device.product && device.product.img" class="device-card__img"/>
                <div class="device-card__img-placeholder" v-else>
                  <i class="el-icon-cpu"></i>
                </div>
              </div>
              <div class="device-card__info">
                <div class="device-card__tags">
                  <dict-tag :options="dict.type.iot_node_type" :value="device.product.nodeType" v-if="isShow('nodeType')"/>
                  <dict-tag :options="dict.type.iot_net_type" :value="device.product.netType" v-if="isShow('netType')"/>
                  <el-tag type="danger" size="mini" v-if="isShow('status') && device.status==='1'">禁用</el-tag>
                </div>
                <div class="device-card__meta">
                  <div class="device-card__meta-item" v-if="isShow('subAddr')">
                    <i class="el-icon-link"></i>
                    <span>{{ device.subAddr }}</span>
                  </div>
                  <div class="device-card__meta-item">
                    <i class="el-icon-position"></i>
                    <span>{{ device.addr }}</span>
                  </div>
                  <div class="device-card__meta-item" v-if="isShow('project')">
                    <i class="el-icon-folder"></i>
                    <span>{{ formatRow(device, {property: 'project'}) }}</span>
                  </div>
                  <div class="device-card__meta-item" v-if="isShow('product')">
                    <i class="el-icon-box"></i>
                    <span>{{ device.product.name }}</span>
                  </div>
                  <div class="device-card__meta-item" v-if="isShow('createTime')">
                    <i class="el-icon-time"></i>
                    <span>{{ parseTime(device.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="device-card__footer" v-if="buttons.length > 0">
              <el-button v-for="button in buttons" :key="button.event"
                         type="text"
                         size="mini"
                         :icon="button.icon"
                         @click="handleClick(button.event, device)"
                         :v-hasPermi="button.permission"
              >{{ button.text }}</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-table :data="tableList" @selection-change="handleSelectionChange" v-else>
        <el-table-column v-if="selectionMode" type="selection" width="55" align="center" />
        <el-table-column v-if="isShow('subAddr')" key="subAddr" label="从站地址" prop="subAddr" align="center"/>
        <el-table-column key="name" label="设备名称" prop="name" align="center"/>
        <el-table-column key="addr" label="设备地址" prop="addr" align="center"/>
        <el-table-column v-if="isShow('netType')" label="连网类型" align="center" prop="netType">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.iot_net_type" :value="scope.row.product.netType"/>
          </template>
        </el-table-column>
        <el-table-column v-if="isShow('project')" label="所属项目" align="center" prop="project" :formatter="formatRow" />
        <el-table-column v-if="isShow('product')" label="所属产品" align="center" prop="product">
          <template slot-scope="scope">{{scope.row.product.name}}</template>
        </el-table-column>
        <el-table-column v-if="isShow('nodeType')" label="设备类型" align="center" prop="nodeType">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.iot_node_type" :value="scope.row.product.nodeType"/>
          </template>
        </el-table-column>
        <el-table-column v-if="isShow('status')" label="是否启用" align="center" width="80">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column v-if="isShow('online')" key="online" label="在线状态" prop="online" align="center">
          <template slot-scope="scope">
            <div v-if="scope.row.product.category === 'ezviz'">-</div>
            <div v-else>
              <el-tooltip v-if="scope.row.lastOnline" class="item" effect="dark" :content="'上线时间：'+parseTime(scope.row.lastOnline)" placement="bottom">
                <dict-tag
                  :options="dict.type.iot_device_status"
                  :value="scope.row.online"
                />
              </el-tooltip>
              <dict-tag v-else
                        :options="dict.type.iot_device_status"
                        :value="scope.row.online"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="isShow('createTime')" label="创建时间" align="center" prop="createTime" width="100">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" v-if="buttons.length > 0">
          <template slot-scope="scope">
            <el-button v-for="button in buttons" :key="button.event"
                       type="text"
                       :icon="button.icon"
                       @click="handleClick(button.event, scope.row)"
                       :v-hasPermi="button.permission"
            >{{button.text}}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination style="margin-bottom:25px;"
                  v-show="total>0"
                  :total="total"
                  :page.sync="queryParams.pageNum"
                  :limit.sync="queryParams.pageSize"
                  @pagination="getList"
      />
    </div>
    <el-empty v-else description="暂无设备"/>
  </div>
</template>
<script>

import {updateObject, queryObject, queryDevStatus, getObject, getDevChildren, queryDevByScene} from "@/api/iot/table";

export default {
  dicts: ['sys_normal_disable', 'iot_node_type', 'iot_device_status', 'iot_net_type'],
  components: {

  },
  props: {
    selectionMode: {
      type: Boolean,
      default: false
    },
    showType: {
      type: String,
      default: 'card'
    },
    columns: {
      type: Array,
      default: function (){
        return [
          {key: 'product', label:'所属产品', visible:true},
          {key: 'project', label:'所属项目', visible:true},
          {key: 'nodeType', label:'设备类型', visible:true},
          {key: 'netType', label:'协议类型', visible:true},
          {key: 'online', label:'在线状态', visible:true},
          {key: 'status', label:'是否启用', visible:true},
          {key: 'createTime', label:'创建时间', visible:true}
        ]
      }
    },
    refresh: {
      type: Boolean,
      default: false
    },
    buttons: {
      type : Array,
      default: function() {
        return []
      }
    },
    queryParams: {
      type : Object,
      default: function() {
        return undefined
      }
    },
    size: {
      type : Array,
      default: function() {
        return [24, 12, 8, 8, 6]
      }
    }
  },
  data() {
    return {
      loading : false,
      table: 'device',
      projects: [],
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      selection: [],
      // gatewayImg: require("@/assets/images/gateway.png"),
      // deviceImg: require("@/assets/images/device.png"),
    };
  },
  created() {
    this.getList();
  },
  methods: {
    isShow(key) {
      const items = this.columns.filter(item => { return item.key === key });
      return items.length > 0 && items[0].visible;
    },
    /** 查询列表 */
    getList() {
      if(this.queryParams){
        this.loading = true;
        const that = this;
        const query = JSON.parse(JSON.stringify(this.queryParams));
        query.pageNum = query.pageNum ? query.pageNum : 1;
        query.pageSize = query.pageSize ? query.pageSize : 10;
        if(query.gateway){
          //根据网关查子设备
          if(!this.columns.includes('subAddr')){
            this.columns.push({ key: 'subAddr', label: '从站地址', visible: true});
          }
          getDevChildren(query).then(response => {
            const rows = response.rows;
            that.formatTableList(that, response.total, rows);
          });
        } else if(query.scene){
          //根据场景查询
          queryDevByScene(query).then(response => {
            const rows = response.rows;
            that.formatTableList(that, response.total, rows);
          })
        }else{
          //查所有设备
          queryObject(this.table, query).then(response => {
            const rows = response.rows;
            that.formatTableList(that, response.total, rows);
          });
        }
      }else{
        this.tableList = [];
      }
    },
    formatTableList(that, total, rows) {
      that.updateTableList(rows, function(onlines, products){
        rows.map(row => {
          const online = onlines.filter(item => { return item.addr === row.addr });
          const product = products.filter(item => { return item.id === row.product });
          if(online && online.length > 0 && online[0].online === 1){
            row.online = 1;
            row.lastOnline=online[0].connectTime;
          }else{
            row.online = 0;
          }
          row.product = product && product.length > 0 ? product[0]: {};
        });
        that.total = total;
        that.tableList = rows;
        that.loading = false;
      });
    },
    // 根据设备列表，再次查询关联的产品、项目、状态信息
    queryRelation(table, ids, callback) {
      let arr = [];
      if(ids.length > 0){
        getObject(table, ids.join(',')).then(response => {
          const rows = response.data;
          if(Array.isArray(rows)){
            arr = rows;
          }else{
            arr.push(rows)
          }
          callback(arr);
        }).catch(err => {
          callback([]);
        })
      } else {
        callback(arr)
      }
    },
    updateTableList(rows, Fun) {
      const that = this;
      const ids = [], devs = [], projects = [];
      rows.map(row => {
        devs.push(row.addr);
        if(row.product && !ids.includes(row.product)){
          ids.push(row.product);
        }
        if(row.project && !projects.includes(row.project)){
          projects.push(row.project);
        }
      });
      queryDevStatus(devs.join(',')).then(response => {
        const online = response.data;
        that.queryRelation('product', ids, function(products){
          that.queryRelation('project', projects, function(projects){
            that.projects = projects;
            Fun(online, products)
          })
        })
      });
    },
    // 多选框选中数据
    handleCardSelectionChange(checked, device) {
      if(checked){
        this.selection.push(device)
      }else{
        this.selection = this.selection.filter(item => { return item.id !== device.id })
      }
      this.handleSelectionChange(this.selection)
      console.log(this.selection);
    },
    handleSelectionChange(selection) {
      const o = {
        selection: selection,
        tableList: this.tableList
      };
      this.$emit('handleSelectionChange', o);
    },
    handleStatusChange(row) {
      return updateObject(this.table, {id : row.id, status : row.status});
    },
    handleClick(event, row) {
      this.$emit('handleEvent', event, row);
    },
    formatRow: function(row, column){
      switch (column.property){
        case 'project':
          if(row.project){
            const project = this.projects.filter(item => {
              return item.id == row.project
            });
            return project && project[0] ? project[0].title : 'ID:' + row.project + ' 无效';
          }else{
            return '未关联'
          }
      }
    }
  },
  watch: {
    queryParams(){
      this.getList();
    },
    refresh() {
      this.getList();
    }
  }
};
</script>
<style lang="scss" scoped>

.el-row {
  display: flex;
  flex-wrap: wrap;
}

.device-card {
  position: relative;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;

  &--offline {
    .device-card__body {
      opacity: 0.75;
    }
  }

  &--disabled {
    border-color: #fde2e2;
    background: #fef0f0;
  }
}

.device-card__status-bar {
  height: 3px;
  width: 100%;

  &.status-online {
    background: linear-gradient(90deg, #67c23a, #85ce61);
  }

  &.status-offline {
    background: linear-gradient(90deg, #c0c4cc, #dcdfe6);
  }
}

.device-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.device-card__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.device-card__name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-card__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.device-card__online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;

  &.dot-online {
    background: #67c23a;
    box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
  }

  &.dot-offline {
    background: #c0c4cc;
  }
}

.device-card__online-text {
  font-size: 12px;
  font-weight: 500;

  &.text-online {
    color: #67c23a;
  }

  &.text-offline {
    color: #909399;
  }
}

.device-card__body {
  display: flex;
  padding: 8px 16px 12px;
  gap: 12px;
  flex: 1;
}

.device-card__image {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.device-card__img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #c0c4cc;
  font-size: 28px;
}

.device-card__info {
  flex: 1;
  min-width: 0;
}

.device-card__tags {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.device-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-card__meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;

  i {
    color: #909399;
    font-size: 13px;
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.device-card__footer {
  padding: 8px 16px;
  border-top: 1px solid #f2f3f5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fafbfc;
}

::v-deep .el-tag {
  border-radius: 4px;
  font-size: 12px;
  padding: 0 6px;
  height: 22px;
  line-height: 20px;
}

::v-deep .device-card__image .el-image {
  width: 100%;
  height: 100%;
}

</style>
