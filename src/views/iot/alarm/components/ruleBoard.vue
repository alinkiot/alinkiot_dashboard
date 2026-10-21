<template>
  <div class="rules-box">
    <el-card class="box-card" shadow="hover">
      <el-row>
        <el-row class="loop-child flex-row">
          <el-select
              class="relations-box"
              v-model="rulesData.relation"
              @change="rulesChange"
          >
            <el-option
                v-for="item in relations"
                :label="item.title"
                :value="item.name"
                :key="item.name"
            ></el-option>
          </el-select>
          <div
              v-if="enableDeleteChild"
              class="delete-child"
              title="删除子条件"
              @click="deleteChild(autoIndex)"
          ><i class="el-icon-delete-solid"></i></div>
          <div
              class="add-child"
              title="添加子条件"
              @click="addChild"
          ><i class="el-icon-s-unfold"></i></div>
          <div
              class="add-sibling"
              title="添加同级条件"
              @click="addCondition"
          ><i class="el-icon-circle-plus"></i></div>
        </el-row>
        <template v-for="(item, index) in rulesData.conditions">
          <el-row :key="'condition'+index" class="flex-row loop-child">
            <el-select
                class="condition-name"
                v-model="item.name"
                @change="rulesChange"
                placeholder="请选择变量"
            >
              <el-option
                  v-for="form in formDatas"
                  :label="form.title"
                  :value="form.name"
                  :key="form.name"
              ></el-option>
            </el-select>
            <el-select
                class="condition-operate"
                v-model="item.operate"
                @change="rulesChange"
                placeholder="请选择逻辑符号"
            >
              <el-option
                  v-for="oper in operators"
                  :label="oper.title"
                  :value="oper.name"
                  :key="oper.name"
              ></el-option>
            </el-select>
            <div class="condition-value">
              <el-input v-if="item.operate === 'like' || item.operate === 'regex' || item.operate === 'fail'"
                  v-model="item.value"
                  @input="rulesChange"
                  placeholder="请输入字符串"
              />
              <el-input v-else
                  v-model="item.value"
                  @input="rulesValueChange(item)"
                  placeholder="请输入数值"
              />
            </div>
            <div
                class="delete-condition"
                @click="deleteCondition(index)"
                title="删除条件"
            ><i class="el-icon-delete-solid"></i></div>
          </el-row>
        </template>
        <el-row
            v-if="rulesData.children.length > 0"
            v-for="(group, index) in rulesData.children"
            class="loop-child"
            :key="'row-' + autoIndex + '-' + index"
        >
          <CreateRule
              :topDatas="rulesData"
              :formDatas="formDatas"
              :rulesData="group"
              :enableDeleteChild="true"
              :autoIndex="index"
              @rulesChange="childChange"
          />
        </el-row>
      </el-row>
    </el-card>
  </div>
</template>
<script>

// import {getObject} from "@/api/iot/table";

export default {
  name: "CreateRule",
  mixins: [],
  props: {
    rulesData: {
      type: Object,
      default: () => {
        return {
          relation: 'and',
          conditions: [],
          children: []
        }
      }
    },
    formDatas: {
      type: Array,
      default: () => {
        return []
      }
    },
    topDatas: {
      type: Object,
      default: () => {
        return {
          relation: 'and',
          conditions: [],
          children: []
        }
      }
    },
    enableDeleteChild: {
      type: Boolean,
      default: false
    },
    autoIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      relations: [{
        title: "满足全部条件[AND]",
        name: "and"
      }, {
        title: "满足任一条件[OR]",
        name: "or"
      }],
      operators: [{
        title: "等于",
        name: "==",
      }, {
        title: "大于",
        name: ">",
      }, {
        title: "大于等于",
        name: ">=",
      }, {
        title: "小于",
        name: "<",
      }, {
        title: "小于等于",
        name: "<=",
      }, {
        title: "不等于",
        name: "!=",
      },{
        title: "字符串相等",
        name: "like",
      },{
        title: "正则",
        name: "regex",
      },{
        title: "抄读超时",
        name: "timeout",
      },{
        title: "非法上报",
        name: "fail",
      }]
    }
  },
  methods: {
    addCondition() {
      const item = this.formDatas && this.formDatas[0] && this.formDatas[0];
      let conditionName = item.name;
      if (conditionName) {
        this.rulesData.conditions.push({
          name: conditionName,
          operate: "==",
          value: ""
        })
        this.rulesChange(this.rulesData)
      } else {
        this.$message.warning("请先获取条件数据！")
      }
    },
    addChild() {
      const item = this.formDatas && this.formDatas[0] && this.formDatas[0];
      let conditionName = item.name
      if (conditionName) {
        this.rulesData.children.push({
          relation: 'and',
          conditions: [
            {
              name: conditionName,
              operate: "==",
              value: ""
            }
          ],
          children: []
        })
        this.changeObserver()//监测组件是否改变的方法,组件改变不等于条件改变的ruleChange方法
      } else {
        this.$message.warning("请先获取条件数据！")
      }
    },
    deleteChild(index) {
      let conditionDelete = this.topDatas && this.topDatas.children && this.topDatas.children.length > 0
      if (conditionDelete) {
        this.topDatas.children.splice(index, 1)
      }
      this.rulesChange(this.rulesData)
    },
    deleteCondition(index) {
      this.rulesData.conditions.splice(index, 1)
      this.rulesChange()
    },
    childChange(childData) {
      this.rulesChange()
    },
    rulesChange() {
      this.changeObserver()
      this.$emit("rulesChange", this.rulesData)
    },
    rulesValueChange(item) {
      console.log(item);
      const currentItems = this.formDatas.filter(thing => {
        return thing.name === item.name;
      });
      if(currentItems && currentItems.length > 0){
        const currentItem = currentItems[0];
        let value = undefined;
        if(currentItem.type === 'integer'){
          value = /^-?\d+$/.test(item.value) ? parseInt(item.value) : undefined;
        } else if(currentItem.type === 'float'){
          value = /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(item.value) ? parseFloat(item.value) : undefined;
        }
        if(!value){
          this.$message.warning("数据格式不正确！");
        }else{
          this.rulesChange();
        }
      }
    },
    changeObserver() {
      this.$emit("changeObserver", this.rulesData)
    }
  }
}
</script>

<style lang="scss" scoped>

.rules-box {
  width: 100%;
  * {
    box-sizing: border-box;
  }

  ::v-deep {
    .el-card__body {
      padding: 0 1em;
    }
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .loop-child {
    width: 100%;
    position: relative;
    border: 1px solid #1682e6;
    border-style: none none none solid;
    padding: 10px 0 10px 12px;
    line-height: 1;

    ::v-deep {
      .el-input__icon {
        width: 14px;
        line-height: 28px;
      }
    }
    &::before {
      display: block;
      content: '';
      position: absolute;
      background-color: white;
      width: 1px;
      height: 50%;
    }
    &:first-child::before {
      left: -1px;
      top: 0;
    }
    &:last-child::before {
      left: -1px;
      bottom: 0;
    }
    &::after {
      top: 50%;
      left: 0;
      position: absolute;
      content: '';
      display: block;
      width: 1px;
      height: 1px;
      border: 1px solid #d9d9d9;
      border-style: solid none none none;
    }
    .relations-box {
      margin-right: 0.5em;
    }
    .delete-child {
      cursor: pointer;
      padding: 0.28em;
      margin-right: 0.5em;
      i {
        color: #f56c6c;
      }
    }
    .delete-condition {
      cursor: pointer;
      padding: 0.28em;
      margin: 0 0 0 0.5em;
      i {
        color:#f56c6c;
      }
    }
    .add-child {
      cursor: pointer;
      padding: 0.28em;
      margin-right: 0.5em;

      i {
        font-size: 18px;
        color:#46a6ff;
      }
    }
    .add-sibling {
      cursor: pointer;
      padding: 0.28em;
      margin-right: 0.5em;

      i {
        font-size: 18px;
        color:#46a6ff;
      }
    }
    .condition-name {
      max-width: 180px;

      ::v-deep {
        .el-input {
          display: inline-block;
        }
      }
    }
    .condition-operate {
      max-width: 150px;
      padding-left: 10px;
      padding-right: 10px;
    }

    .condition-value {
      flex: 1;
    }
  }
}
</style>
