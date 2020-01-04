<template>
	<view class="content" :disable-scroll='true'>
		<view class="userinfo">
      <view class='user-show' v-if='userInfo.avatarUrl'>
        <image class='user-avatar' :src="avatarHd"></image>
				<view class='user-hat' 
					@touchstart='handleTouchStart' 
					@touchmove.stop='handleTouchMove' 
					:style='hatStyleStr'>
					<image class='hat' id='hat' src='/static/img/hat.png' :style='hatImgStyleStr'></image>
					<view class='rotate' id='rotate' :style='rotateStyleStr'>
						<image class='rotate-icon' id='rotate' src='/static/img/icon-rotate.png'></image>
					</view>
				</view>
      </view>
		</view>
		<view class='user-buttons'>
			<!-- <button type="primary" plain @tap='uploadAvatar'>更改头像</button> -->
			<!-- #ifdef H5-->
      <button type="primary" v-if='!userInfo.avatarUrl' @tap='onH5GetUserInfo'>获取头像</button>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN-->
      <button type="primary" open-type="getUserInfo" v-if='!userInfo.avatarUrl' @getuserinfo='onGetUserInfo'>获取微信头像</button>
			<!-- #endif -->
			<!-- #ifdef MP-ALIPAY -->
      <button type="primary" open-type="getUserInfo" v-if='!userInfo.avatarUrl' @tap="onAliGetUserInfo">获取支付宝头像</button>
			<!-- #endif -->
			<button type="primary" v-if='userInfo.avatarUrl' @tap='drawCanvas'>生成头像</button>
		</view>

		<view class='canvas-modal' :class='{show:showCanvas}'>
			<canvas class='canvas-avatar' id='avatarCanvas' canvas-id='avatarCanvas'></canvas>
			<view class='user-buttons'>
				<button @tap='showCanvas = false'>返回</button>
				<button type="primary" @tap='saveAvatar'>保存到相册</button>
			</view>
		</view>
	</view>
</template>

<script>
  import { mapState, mapMutations } from 'vuex';

	export default {
		data() {
			return {
				showCanvas:false,
				imgUrl: '',
				defaultHatWidth:100,
				defaultHatHeight:100,
				canvasTempFilePath:'',
				hatTop:140,
				hatLeft:140,
				currentHatTop:'',
				currentHatLeft:'',
				rotateTop:0,
				rotateLeft:0,
				beforeAngel:45,
				currentRotateTop:'',
				currentRotateLeft:'',
				hatScale:1,
				hatRotate:0,
				touchTarget:'',
				currentPos:{
					x:'',
					y:''
				}
			}
		},
		computed:{
			...mapState(['openId', 'userInfo']),
			avatarHd(){
				if(this.imgUrl) return this.imgUrl
				if(this.userInfo.avatarUrl){
					//#ifdef MP-WEIXIN
					return this.getHdUrl(this.userInfo.avatarUrl);
					//#endif

					//#ifndef MP-WEIXIN
					return this.userInfo.avatarUrl;
					//#endif
				}
			},
			hatHalfWidth(){
				return this.defaultHatWidth / 2
			},
			hatRadius(){
				return Math.sqrt(2 * (this.hatHalfWidth) * (this.hatHalfWidth))
			},
			hatStyleStr(){
				return `transform:translate(${this.hatLeft}px,${this.hatTop}px)`
			},
			hatImgStyleStr(){
				return `transform:scale(${this.hatScale}) rotate(${this.hatRotate}deg)`
			},
			rotateStyleStr(){
				return `transform:translate(${this.rotateLeft}px,${this.rotateTop}px)`
			}
		}, 
		onLoad() {
			//#ifndef H5
      this.getOpenid()
      this.getSetting()
			//#endif
		},
		methods:{
			...mapMutations(['setOpenId','setUserInfo']),
			
			getHdUrl(url){
				let imgUrl = url.split('/')
				imgUrl[imgUrl.length-1] = 0
				imgUrl = imgUrl.join('/')
				return imgUrl
			},
			// touch事件处理
			handleTouchStart(e){
				this.currentHatTop = this.hatTop
				this.currentHatLeft = this.hatLeft
				this.currentRotateLeft = this.rotateLeft
				this.currentRotateTop = this.rotateTop
				this.touchTarget = e.target.id
				this.currentPos = {x:e.touches[0].clientX,y:e.touches[0].clientY}
			},
			handleTouchMove(e){
				e.preventDefault()
				if(this.touchTarget){
					const pos = {x:e.touches[0].clientX,y:e.touches[0].clientY}
					const moveX = pos.x - this.currentPos.x
					const moveY = pos.y - this.currentPos.y
					if(this.touchTarget === 'hat'){
						this.hatLeft = this.hatLeft + moveX
						this.hatTop = this.hatTop + moveY
					}
					else if(this.touchTarget === 'rotate'){
						this.rotateLeft = this.rotateLeft + moveX
						this.rotateTop = this.rotateTop + moveY
						const nowWidth = this.rotateLeft + this.hatHalfWidth
						const nowHeight = this.rotateTop + this.hatHalfWidth
						const nowRadius = Math.sqrt(nowWidth * nowWidth + nowHeight * nowHeight)
						this.hatScale = nowRadius / this.hatRadius
						const nowAngel = Math.atan2(nowHeight,nowWidth) / Math.PI * 180
						// console.log(this.beforeAngel)
						// console.log(nowAngel)
						this.hatRotate = nowAngel - this.beforeAngel + this.hatRotate
						this.beforeAngel = nowAngel
						// this.beforeAngel =
					}
					this.currentPos = pos
				}
			},
			handleTouchEnd(e){
				this.touchTarget = ''
			},
			// 调用云函数
      onGetUserInfo(e){
        this.setUserInfo(e.detail.userInfo);
			},
			onH5GetUserInfo(){
				this.setUserInfo({
					avatarUrl:'/static/img/avatar.jpeg'
				});
			},
			onAliGetUserInfo(){
				my.getAuthCode({
					scopes: 'auth_user',
					success: (res) => {
						uni.getUserInfo({
							success: res => {
								this.setUserInfo(res.userInfo);
								console.log(res.userInfo.avatarUrl)
							},
							fail:(error)=>{
								console.error(error)
							}
						});
					},
				});
			},
      getSetting(){
        uni.getSetting({
          success: res => {
						console.log(res)
            if (res.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
              uni.getUserInfo({
                success: res => {
                  console.log(res)
									this.setUserInfo(res.userInfo);
                }
              });
            }
          }
        });
      },
      getOpenid(){
				if (wx.cloud) {
					wx.cloud.callFunction({
						name: 'login',
						data: {},
						success: res => {
							console.log('[云函数] [login] user openid: ', res.result.openid);
							this.setOpenId(res.result.openid);
							console.log(this.openId)
						},
						fail: err => {
							console.error('[云函数] [login] 调用失败', err);
						}
					});
				}
			},
			uploadAvatar() {
				// 选择图片
				uni.showLoading({
					title: '上传中',
				})
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album'],
					success: res => {
						uni.hideLoading()
						const filePath = res.tempFilePaths[0]
						this.imgUrl = filePath
					},
					fail: e => {
						uni.hideLoading()
						console.error(e)
					}
				})
			},
			// 画图
			async drawCanvas(){
				this.showCanvas = true
				uni.showLoading({
					title: '正在生成图片'
				})
				//#ifdef H5
				const path = '/static/img/avatar.jpeg'
				//#endif
				//#ifndef H5
				const path = await this.getImagePath()
				//#endif
				console.log(path)
				const wrapperWidth = uni.getSystemInfoSync().windowWidth
				const context = uni.createCanvasContext('avatarCanvas')
				const hatSize = this.hatHalfWidth * 2 * this.hatScale
				context.clearRect(0, 0, wrapperWidth, wrapperWidth)
				context.drawImage(path, 0, 0, wrapperWidth, wrapperWidth)
				context.translate(this.hatLeft + this.hatHalfWidth,this.hatTop + this.hatHalfWidth)
				context.rotate(this.hatRotate * Math.PI / 180)
				console.log(-hatSize/2)
				context.drawImage("/static/img/hat.png", -hatSize/2, -hatSize/2, hatSize, hatSize)
				context.draw()
				uni.hideLoading()
			},
			getImagePath(){
				return new Promise((reslove,reject) => {
					if(this.imgUrl) reslove(this.imgUrl)
					uni.getImageInfo({
						src: this.avatarHd,
						success:  (image)=> {
							console.log(image.path)
							reslove(image.path)
						}
					})
				})
			},
			base64ToBlob(code){
				let parts = code.split(';base64,')
        let contentType = parts[0].split(':')[1]
        let raw = window.atob(parts[1])
        let rawLength = raw.length
        let uInt8Array = new Uint8Array(rawLength)
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i)
        }
        return new Blob([uInt8Array], {type: contentType})
			},
			saveAvatar(){
				uni.canvasToTempFilePath({
					x: 0,
					y: 0,
					width: uni.getSystemInfoSync().windowWidth,
					height: uni.getSystemInfoSync().windowWidth,
					canvasId: 'avatarCanvas',
					success: (res)=> {
						//#ifdef H5
						const blob = this.base64ToBlob(res.tempFilePath)
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = URL.createObjectURL(blob);
						a.download = '圣诞头像.png';
						const event = document.createEvent('MouseEvents');
						event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						a.dispatchEvent(event);
						//#endif

						//#ifndef H5
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: ()=> {
								uni.showToast({
									title:'已保存到相册'
								})
								console.log('save success');
							}
						});
						//#endif
					} 
				})
			}
		}
	}
</script>

<style lang='scss'>
	.content{
		background-color: #fff;
	}
	.user-show{
		display: block;
		text-align: center;
		position: relative;
	}
  .user-avatar{
		display: block;
    width:100vw;
    height:100vw;
    background-repeat: no-repeat;
  }
	.user-hat{
		position: absolute;
		top:0;
		left:0;
		height:104px;
		width: 104px;;
		.hat{
			width: 100px;
			height: 100px;
			border:dashed 2px rgb(187, 183, 183);
		}
		.rotate{
			width:20px;
			height:20px;
			padding:5px;
			position: absolute;
			right:-15px;
			bottom:-15px;
			background-color: #d81e06;
			border-radius:50%;
			.rotate-icon{
				width: 20px;
				height:20px;
			}
		}
	}
  .user-nick{
    display: block;
    text-align: center;
  }
	.user-buttons{
		display: flex;
		justify-content: center;
		padding-top: 20px;
		button{
			display: block;
			margin:0 8px;
			width:auto;
		}
	}
	.canvas-modal{
		width: 100%;
		height:100%;
		position: absolute;
		display: none;
		top:0;
		left:0;
		background-color: rgba($color: #ffffff, $alpha: 1);
		&.show{
			display: block;
		}
	}
	.canvas-avatar{
    width:100vw;
    height:100vw;
		margin:0 auto;
		border-radius:4px;
	}
	.center-point{
		position: absolute;
		top:50%;
		left:50%;
		width: 6px;
		height:6px;
		background-color: red;
		margin-left:-3px;
		margin-top:-3px;
	}
</style>
