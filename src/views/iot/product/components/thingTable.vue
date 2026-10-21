<template>
    <el-table
        :data="things"
        stripe>
      <el-table-column
          prop="title"
          align="left"
          label="监测名称">
        <template slot-scope="scope">
          <svg-icon v-if="scope.row.icon" slot="prefix" :icon-class="scope.row.icon"/>
          {{scope.row.title}}
        </template>
      </el-table-column>
      <el-table-column
          prop="name"
          align="left"
          label="变量名">
      </el-table-column>
      <el-table-column
          prop="access"
          align="center"
          label="读写">
      </el-table-column>
      <el-table-column
          prop="type"
          align="center"
          label="类型">
      </el-table-column>
      <el-table-column
          :formatter="formatter"
          prop="range"
          align="center"
          label="取值范围">
      </el-table-column>
      <el-table-column
          prop="precision"
          align="center"
          label="精度">
      </el-table-column>
      <el-table-column
          prop="unit"
          align="center"
          label="单位">
      </el-table-column>
      <el-table-column
          :formatter="formatter"
          prop="rate"
          align="center"
          label="数据校正">
      </el-table-column>
      <el-table-column
          align="center"
          label="操作">
        <template slot-scope="scope">
          <el-button
              v-if="type==='1'"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="editThing(scope.$index, scope.row)">编辑
          </el-button>
          <el-button
              v-if="type==='1'"
              size="mini"
              type="text"
              icon="el-icon-delete"
              style="color:red;"
              @click="deleteThing(scope.$index, scope.row)">删除
          </el-button>
          <el-button
              v-if="type==='2'"
              size="mini"
              type="text"
              @click="editThing(scope.$index, scope.row)">选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
</template>
<script>

export default {
  props: {
    type: {
      type: String,
      default: function() {
        return '1'
      }
    },
    things: {
      type : Array,
      require: true
    }
  },
  data() {
    return {
    };
  },
  created() {
  },
  methods: {
    formatter: function (row, column) {
      switch (column.property){
        case 'range':
          const min = row.min ? row.min : '-∞';
          const max = row.max ? row.max : '∞';
          return min + ' ~ ' + max;
          break;
        case 'rate':
          const rate = row.rate ? row.rate : 1;
          const offset = row.offset ? row.offset : 0;
          return '值 * ' + rate + ' + ' + offset;
          break;
      }
    },
    editThing: function (index, row) {
      this.$emit("selectDone", row);
    },
    deleteThing: function (index, row) {
      this.$emit("deleteThing", row);
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
