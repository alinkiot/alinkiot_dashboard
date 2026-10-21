<template>
  <div v-if="visible">
    <el-form ref="configForm" hide-required-asterisk size="small" label-position="top" :model="connection">
      <el-button-group>
        <el-button
            type="success"
            size="small"
            :disabled="client.connected"
            @click="createConnection"
            :loading="connecting"
        >
          {{ client.connected ? '已连接' : '连接' }}
        </el-button>
        <el-button v-if="client.connected" type="danger" size="small" @click="destroyConnection">
          断开
        </el-button>
      </el-button-group>
    </el-form>
  </div>
</template>

<script>
import mqtt from 'mqtt'
import store from "@/store";


export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    subscription: {
      type: Object,
      default: function(){ return undefined; }
    },
    publish: {
      type: Object,
      default: function(){ return undefined; }
    }
  },
  data() {
    return {
      connection: {
        protocol: 'ws',
        host: undefined,
        port: 80,
        endpoint: '/mqtt',
        clean: true,
        connectTimeout: 30 * 1000, // ms
        reconnectPeriod: 4000, // ms
        clientId: undefined,
        username: undefined,
        password: undefined,
      },
      user: {},
      qosList: [0, 1, 2],
      client: {
        connected: false,
      },
      subscribeSuccess: false,
      connecting: false,
      retryTimes: 0,
    }
  },
  created() {
    const  key = window.location.protocol === 'https:'?'mqtt_wss' : 'mqtt_ws';
    this.connection.protocol = key === 'mqtt_wss'? 'wss' : 'ws';
    if(window.location.port == ''){
      this.connection.port = key === 'mqtt_wss' ? 443 : 80;
    }else{
      this.connection.port = window.location.port;
    }
    try {
      const BaseApi = new URL(process.env.VUE_APP_BASE_API);
      this.connection.port = BaseApi.port;
      this.connection.host = BaseApi.hostname;
    } catch (error) {
      this.connection.host = window.location.hostname;
    }
    console.log('mqtt over ws:', this.connection.host, this.connection.port);
    const userName = store.getters.name;
    const token = store.getters.token;
    this.connection.clientId = 'user_' + userName + '_' + Math.random().toString(16).substring(2, 8);
    this.connection.username = userName;
    this.connection.password = token;
    this.createConnection();
  },
  methods: {
    initData() {
      this.client = {
        connected: false,
      }
      this.retryTimes = 0
      this.connecting = false
      this.subscribeSuccess = false
    },
    handleOnReConnect() {
      this.retryTimes += 1
      if (this.retryTimes > 5) {
        try {
          this.client.end()
          this.initData()
          console.log('Connection maxReconnectTimes limit, stop retry')
        } catch (error) {
          console.log(error.toString())
        }
      }
    },
    createConnection() {
      try {
        this.connecting = true;
        const { protocol, host, port, endpoint, ...options } = this.connection;
        const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
        this.client = mqtt.connect(connectUrl, options);
        if (this.client.on) {
          this.client.on('connect', () => {
            this.connecting = false;
            console.log('Connection succeeded!', this.subscription);
            this.doSubscribe();
          });
          this.client.on('reconnect', this.handleOnReConnect)
          this.client.on('error', error => {
            console.log('Connection failed', error)
          });
          const that = this;
          this.client.on('message', (topic, message) => {
            const decoder = new TextDecoder("utf-8");
            const payload = decoder.decode(message);
            that.$emit("doMqttMessage", topic, payload);
          });
        }
      } catch (error) {
        this.connecting = false
        console.log('mqtt.connect error', error)
      }
    },
    doSubscribe() {
      if(this.client.subscribe && this.subscription){
        const { topic, qos } = this.subscription;
        if(topic && topic !==''){
          this.client.subscribe([topic], { qos }, (error, res) => {
            if (error) {
              console.log('Subscribe error ' + topic, error, res)
              return
            }
            console.log('Subscribe success ' + topic)
            this.subscribeSuccess = true
          })
        }
      }
    },
    doUnSubscribe() {
      const { topic } = this.subscription
      this.client.unsubscribe(topic, error => {
        if (error) {
          console.log('Unsubscribe error', error)
        }
      })
    },
    doPublish() {
      const { topic, qos, payload } = this.publish
      this.client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.log('Publish error', error)
        }
      })
    },
    destroyConnection() {
      if (this.client.connected) {
        try {
          this.client.end(false, () => {
            this.initData()
            console.log('Successfully disconnected!')
          })
        } catch (error) {
          console.log('Disconnect failed', error.toString())
        }
      }
    }
  },
  watch: {
    subscription() {
      this.doSubscribe();
    },
    publish() {
      this.doPublish();
    }
  }
}
</script>

<style lang="scss">

</style>
