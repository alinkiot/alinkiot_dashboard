<template>
  <div class="table-show">
    <div class="table-show__header" v-if="buttons.length > 0 || title">
      <span class="table-show__title" v-if="title">{{ title }}</span>
      <div class="table-show__actions">
        <el-button
          type="text"
          v-for="btn in buttons" :key="btn.key"
          :class="btn.icon" @click="doClick(btn)">{{ btn.title }}</el-button>
      </div>
    </div>
    <div v-if="columns.length > 0" class="table-show__body">
      <div class="table-show__item" v-for="column in columns" :key="column.key">
        <span class="table-show__label">{{ column.title }}</span>
        <span class="table-show__value">
          <template v-if="column.type === 'map'">
            <MapSelector
              :ref="'map_' + column.key"
              :name="column.key"
              :location="getValue(column)" :lat="getLngLat('lat', column)"
              :lng="getLngLat('lng', column)"
              @selectDone="selectMapDone"
            />
          </template>
          <template v-else-if="column.type === 'dict'">
            <dict-tag :options="column.options" :value="getValue(column)"/>
          </template>
          <template v-else-if="checkEmpty(column)">--</template>
          <template v-else>
            <template v-if="column.type === 'href'">
              <el-link type="primary" :underline="true" :href="getValue(column)" target="_blank">访问</el-link>
            </template>
            <template v-else-if="column.type === 'image'">
              <ImagePreview style="width: 20px;" :src="getValue(column)"/>
            </template>
            <template v-else-if="column.type === 'secret'">
              <span class="table-show__secret">******</span>
              <el-popover
                placement="bottom"
                :title="column.title + ':'"
                width="200"
                trigger="click"
                :content="getValue(column)">
                <el-button slot="reference" type="text" icon="el-icon-view"/>
              </el-popover>
            </template>
            <template v-else>
              {{ getValue(column) }}
            </template>
          </template>
          <el-button v-if="column.click"
                     type="text"
                     @click="doClick(column)"
                     :icon="column.click.icon" circle>
            <template v-if="column.click.title">
              {{ column.click.title }}
            </template>
          </el-button>
        </span>
      </div>
    </div>
    <el-empty :description="'暂无' + title" v-else/>
  </div>
</template>

<script>
import dayjs from "dayjs";
import ImagePreview from "@/components/ImagePreview/index.vue";
import MapSelector from "@/components/MapSelector/index.vue";

export default {
  components: {
    MapSelector,
    ImagePreview
  },
  props: {
    title: {
      type: String,
      default: undefined
    },
    columns: {
      type: Array,
      default: () => []
    },
    item: {
      type: Object,
      default: () => ({})
    },
    buttons: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    checkEmpty(column) {
      const value = this.getValue(column);
      return value === null || value === undefined || value === '';
    },
    doClick(column) {
      this.$emit('click', column);
    },
    selectMapDone(data) {
      const name = data.name;
      const arr = this.columns.filter(item => item.key === name);
      if (arr.length > 0) {
        this.$emit('selectMapDone', arr[0], data);
      }
    },
    getLngLat(key, column) {
      return this.item[column[key]];
    },
    getValue(column) {
      const key = column.key;
      const format = column.format;
      let value = this.item[key];
      if (column.type === 'relation') {
        const field = column.on;
        let other = this.item[field];
        if (format) {
          return format(key, { field: other, key: value });
        } else {
          if (!other && !value) return undefined;
          other = other ? other : '--';
          value = value ? value : '--';
          return [value, other].join(",");
        }
      } else if (column.type === 'datetime') {
        if (value) {
          return dayjs(value * 1000).format('YYYY-MM-DD HH:mm:ss');
        }
        return undefined;
      } else {
        if (format) {
          return format(key, value);
        }
        return value;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.table-show {
  margin-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__body {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    min-height: 40px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #86868b;
    min-width: 72px;
    flex-shrink: 0;
  }

  &__value {
    flex: 1;
    font-size: 14px;
    word-break: break-word;
    overflow-wrap: anywhere;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__secret {
    letter-spacing: 2px;
    margin-right: 4px;
  }
}
</style>

<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .table-show__item:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  .table-show__label {
    color: rgba(255, 255, 255, 0.45);
  }
}
</style>
