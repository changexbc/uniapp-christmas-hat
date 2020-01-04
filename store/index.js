import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		openId:'',
    userInfo:{},
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
