import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		/**
		 * 是否需要强制登录
		 */
		openId:'',
    userInfo:{},
		forcedLogin: false,
		hasLogin: false,
		userName: ""
	},
	mutations: {
		getOpenId(state, userName) {
			return state.openId
		},
		setOpenId(state,openId) {
			state.openId = openId
		},
    setUserInfo(state,userInfo){
      state.userInfo = userInfo
    }
	}
})

export default store
