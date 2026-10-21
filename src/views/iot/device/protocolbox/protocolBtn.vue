<!--  -->
<template>
    <div class="protocol-btn">
        <el-button-group>
<!--            <el-button type="primary" size="mini" icon="el-icon-setting" @click="changeDrawer">-->
<!--                远程配置-->
<!--            </el-button>-->
        </el-button-group>
        <el-drawer title="远程配置" :visible.sync="drawer" @before-close="handlerClose">
            <div class="protocol-content">
                <el-button type="primary" size="mini">读取配置</el-button>
                <div class="protocol-content-box">
                    <div class="protocol-content-box-form">
                        <el-form :model="dynamicValidateForm" ref="dynamicValidateForm" label-width="100px" size="mini"
                            class="demo-dynamic">
                            <div v-for="(domain, index) in dynamicValidateForm.RS485" :key="domain.key">
                                <el-card>
                                    <div slot="header" class="demo-dynamic-title">
                                        {{ '配置' + (index + 1) }}
                                    </div>
                                    <!--丛机地址-->
                                    <el-form-item :label="'丛机地址:'" :prop="'RS485.' + index + '.adress'" :rules="{
                                        required: true, message: '丛机地址', trigger: 'blur'
                                    }">
                                        <el-input-number v-model="domain.adress" :min="1" :max="254"></el-input-number>
                                    </el-form-item>
                                    <!--波特率-->
                                    <el-form-item :label="'波特率:'" :prop="'RS485.' + index + '.BaudRate'" :rules="{
                                        required: true, message: '波特率不能为空', trigger: 'change'
                                    }">
                                        <el-select v-model="domain.BaudRate" placeholder="请选择波特率">
                                            <el-option label="2400" value="2400"></el-option>
                                            <el-option label="4800" value="4800"></el-option>
                                            <el-option label="9600" value="9600"></el-option>
                                            <el-option label="19200" value="19200"></el-option>
                                            <el-option label="38400" value="38400"></el-option>
                                            <el-option label="115200" value="115200"></el-option>
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item :label="'功能码:'" :prop="'RS485.' + index + '.Feature'" :rules="{
                                        required: true, message: '功能码', trigger: 'change'
                                    }">
                                        <el-select v-model="domain.Feature" placeholder="请选择功能码">
                                            <el-option label="3" value="3"></el-option>
                                            <el-option label="4" value="4"></el-option>
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item :label="'起始寄存器:'" :prop="'RS485.' + index + '.startReg'" :rules="{
                                        required: true, message: '起始寄存器', trigger: 'blur'
                                    }">
                                        <el-input-number v-model="domain.startReg" :min="0"
                                            :max="255"></el-input-number>
                                    </el-form-item>
                                    <el-form-item :label="'寄存器数量:'" :prop="'RS485.' + index + '.numReg'" :rules="{
                                        required: true, message: '寄存器数量', trigger: 'blur'
                                    }">
                                        <el-input-number v-model="domain.numReg" :min="1" :max="50"></el-input-number>
                                    </el-form-item>
                                    <el-button class="delete-button" @click.prevent="removeDomain(domain)"
                                        size="mini">删除</el-button>

                                </el-card>
                            </div>
                            <div class="demo-dynamic-operator">

                            </div>
                            <el-form-item>
                                <el-button type="primary" @click="submitForm('dynamicValidateForm')">提交</el-button>
                                <el-button type="primary" @click="addDomain">新增配置</el-button>
                                <el-button @click="resetForm('dynamicValidateForm')">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </div>

                </div>
            </div>

        </el-drawer>
    </div>
</template>

<script>
export default {
    name: 'ProtocolBtn',
    props: {
        protocol: {
            typeof: String,
            default: ''
        }
    },
    data () {
        return {
            drawer: false,
            dynamicValidateForm: {
                RS485: [{
                    BaudRate: '',
                    adress: '',
                    Feature: '',
                    startReg: '',
                    numReg: '',
                }],
            }
        };
    },

    components: {},

    computed: {},

    mounted () { },

    methods: {
        changeDrawer () {
            console.log(this.protocol)
            this.drawer = true;
        },
        handlerClose () {
            this.drawer = false;
        },
        submitForm (formName) {
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    alert('submit!');
                } else {
                    console.log('error submit!!');
                    return false;
                }
            });
        },
        resetForm (formName) {
            this.$refs[formName].resetFields();
        },
        removeDomain (item) {
            var index = this.dynamicValidateForm.RS485.indexOf(item)
            if (index !== -1) {
                this.dynamicValidateForm.RS485.splice(index, 1)
            }
        },
        addDomain () {
            this.dynamicValidateForm.RS485.push({
                BaudRate: '',
                adress: '',
                Feature: '',
                startReg: '',
                numReg: '',
                key: Date.now()
            });
        }
    }
}

</script>
<style lang='scss' scoped>
.protocol-btn {
    //margin-left: 10px;
}
</style>
<style lang="scss">
.protocol-content {
    padding: 20px;
    box-sizing: border-box;

    &-box {
        margin-top: 20px;

        .delete-button {
            margin-left: 80px;
        }

        .demo-dynamic-operator {
            margin-top: 20px;
        }

        .demo-dynamic-title {
            margin-left: 20px;
            // margin-bottom: 20px;
        }
    }
}
</style>
