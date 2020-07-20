//服务器中映射的项目根目录，兼容天津某些盒子不正常相对路径跳转，部署时添加。
var BaseHost = "http://202.99.114.152:32215";
var BaseHostSD = "http://202.99.114.152:32215/SD";
//按键事件注册
var _keyName = "";
var _epg = true;
var keyBase = {
	record: "",
	STB_Key: function (keyEvent) {
		keyEvent = keyEvent ? keyEvent : window.event;
		var prevent = false;
		var keyCode = keyEvent.keyCode || keyEvent.which || keyEvent.charCode || keyEvent;
		switch (keyCode) {
			// 方向键
			//"LEFT"左
			case 3: //大亚科技
			case 29:
			case 37: //ipanel 华为
			case 65361:
				_keyName = "KEY_LEFT";
				//prevent = true;
				break;
				//上
			case 1: //大亚科技
			case 28: //
			case 38: //ipanel 华为
			case 65362:
				_keyName = "KEY_UP";
				//prevent = true;
				break;
				//右
			case 4: //大亚科技
			case 30:
			case 39: //ipanel 华为
			case 65363:
				_keyName = "KEY_RIGHT";
				//prevent = true;
				break;
				//下
			case 2: //大亚科技
			case 31:
			case 40: //ipanel 华为
			case 65364:
				_keyName = "KEY_DOWN";
				//prevent = true;
				break;
				// 翻页键
			case 33:
				_keyName = "KEY_PAGEUP";
				break;
			case 34:
				_keyName = "KEY_PAGEDOWN";
				break;
				// 返回/退格、回车/确认、空格键
			case 8:
			case 32: //创维安卓
			case 122: //ipanel2.0
			case 270:
			case 340: //新疆广电盒子
			case 640: //coship
			case 65367: //
				_keyName = "KEY_BACK"; //KEY_BACKSPACE
				//prevent = true;
				break;
			case 13: //ipanel 大亚科技 华为
			case 65293:
				_keyName = "KEY_ENTER"; //KEY_OK
				break;
			case 15:
				_keyName = "KEY_SPACEBAR";
				break;
				// 数字键
			case 48: //ipanel 大亚科技 华为
			case 96:
				_keyName = "KEY_0";
				break;
			case 49:
			case 97:
				_keyName = "KEY_1";
				break;
			case 50:
			case 98:
				_keyName = "KEY_2";
				break;
			case 51:
			case 99:
				_keyName = "KEY_3";
				break;
			case 52:
			case 100:
				_keyName = "KEY_4";
				break;
			case 53:
			case 101:
				_keyName = "KEY_5";
				break;
			case 54:
			case 102:
				_keyName = "KEY_6";
				break;
			case 55:
			case 103:
				_keyName = "KEY_7";
				break;
			case 56:
			case 104:
				_keyName = "KEY_8";
				break;
			case 57:
			case 105:
				_keyName = "KEY_9";
				break;
				// 功能键
				//音量+
			case 259:
				_keyName = "KEY_VOL_UP";
				break;
				//音量-
			case 260:
				_keyName = "KEY_VOL_DOWN";
				break;
			case 261:
				_keyName = "KEY_MUTE";
				break;
			case 262:
				_keyName = "KEY_TRACK";
				break;
			case 263:
				_keyName = "KEY_PAUSE_PLAY";
				break;
				// 播放键
			case 264:
				_keyName = "KEY_FAST_FORWARD"; //快进键
				break;
			case 265:
				_keyName = "KEY_FAST_REWIND"; //快退键
				break;
			case 266:
				_keyName = "KEY_GO_END";
				break;
			case 267:
				_keyName = "KEY_GO_BEGINNING";
				break;
			case 268:
				_keyName = "KEY_INFO";
				break;
			case 269:
				_keyName = "KEY_INTERX";
				break;
			case 270:
				_keyName = "KEY_STOP";
				break;
			case 271:
				_keyName = "KEY_POS";
				break;
			case 1105:
				_keyName = "KEY_SEARCH";
				break;
			case 1240:
				_keyName = "KEY_CAPTION";
				break;
			case 1246:
				_keyName = "KEY_INTERACTIVE";
				break;
				//虚拟事件
			case 768:
				if (typeof (Utility) != "object" || !("getEvent" in Utility)) {
					return;
				}
				var event = Utility.getEvent();
				var typeStr = event.type;
				if (typeof (typeStr) == "undefined" || typeStr == "") {
					var tArray = new Array();
					tArray = event.split(",");
					var temp = tArray[0];
					var index = temp.indexOf(":") + 2;
					typeStr = temp.substring(index, temp.length - 1);
				}
				switch (typeStr) {
					case "EVENT_MEDIA_ERROR": //视频播放出错
						_keyName = "EVENT_MEDIA_ERROR";
						break;
					case "EVENT_MEDIA_END": //视频播放结束
						_keyName = "EVENT_MEDIA_END";
						break;
					default:
						break;
				}
				break;
			default:
				_keyName = "";
				break;
		}

		if (prevent) {
			//禁止左右上下键的时候屏幕滚动及事件冒泡
			if (keyEvent.preventDefault) {
				keyEvent.preventDefault();
			} else if (keyEvent.returnValue) {
				keyEvent.returnValue = false;
			} else if (keyEvent.stopPropagation) {
				evt.stopPropagation();
			}
		}
		//调用自定义按键函数
		keyBase.keyEvents(keyCode);
		return _keyName;
	},
	//按键事件注册 监听_keyName值
	keyEvents: _throttle(function (keyCode) {
		//try {
		//阻止非数字按键唤醒日志
		//判断是否是数字 

		if (!isNaN(_keyName.substr(_keyName.length - 1, 1))) {
			this.record += _keyName + "|";
			if (_keyName == "KEY_9") { //数字键9，清空数字键存储，或清空一条日志
				evm.clearDebug();
				this.record = "";
			}
			evm.setDebug("键值：" + this.record);
			if (this.record == "KEY_1|KEY_3|") { //个人中心-按键为1+3组合时，进入测试页
				window.location.href = BaseHost + "/html/test.html" + window.location.search;
			} else if (this.record == "KEY_1|KEY_4|") { //个人中心-按键为1+3组合时，进入测试页
				window.location.href = BaseHost + "/html/gametest.html" + window.location.search;
			} else if (this.record == "KEY_1|KEY_8|") { //按键为1+0组合时，打开或关闭屏幕日志
				evm.openDebug();
			}
		}


		//函数位于其他页面
		if (typeof keyevent === "function") {
			keyevent();
		}

		//console.log(this.record);
		//} catch (error) {
		//	console.log(error);
		//}

	}, 350)
};

if (typeof (window.mp) != 'undefined') {
	_epg = true;
}
var userAgent = navigator.userAgent.toLowerCase()
if (_epg || /webkit/g.test(userAgent) || /edg/g.test(userAgent)) {
	document.onkeydown = keyBase.STB_Key;
	console.log("document.onkeydown ");
} else {
	document.onkeypress = keyBase.STB_Key;
	console.log("document.onkeypress");
}

function KeyEventEPG(keyCode) {
	var androidKeyMap = {
		3: "KEY_HOME",
		4: 8, // 返回键
		7: 48,
		8: 49,
		9: 50,
		10: 51,
		11: 52,
		12: 53,
		13: 54,
		14: 55,
		15: 56,
		16: 57,
		19: 38, // 上
		20: 40, // 下
		21: 37, // 左
		22: 39, // 右
		23: 13, // KEYCODE_DPAD_CENTER
		66: 13, // 小米盒子的KEYCODE_ENTER
		82: "KEY_MENU" // 菜单
	};
	keyBase.STB_Key(androidKeyMap[keyCode]);
}

function onKeyEvent(keycode, keyaction) {
	if (keyaction == 0) { //key_down
		var androidKeyMap = {
			3: "KEY_HOME",
			4: 8, // 返回键
			7: 48,
			8: 49,
			9: 50,
			10: 51,
			11: 52,
			12: 53,
			13: 54,
			14: 55,
			15: 56,
			16: 57,
			19: 38, // 上
			20: 40, // 下
			21: 37, // 左
			22: 39, // 右
			23: 13, // KEYCODE_DPAD_CENTER
			66: 13, // 小米盒子的KEYCODE_ENTER
			82: "KEY_MENU" // 菜单
		};
		keyBase.STB_Key(androidKeyMap[keycode]);
		return;
	}
}
if (typeof (iPanel) != 'undefined') {
	iPanel.focus.borders = '0';
	iPanel.focusWidth = '0';
	iPanel.defaultFocusColor = 'transparent';

}
/**
 * @desc 函数防抖
 * @param func 函数
 * @param wait 延迟执行毫秒数
 * @param immediate true 表立即执行，false 表非立即执行
 */
function _debounce(func, wait, immediate) {
	var timeout;

	return function () {
		var context = this;
		var args = arguments;

		if (timeout) clearTimeout(timeout);
		if (immediate) {
			var callNow = !timeout;
			timeout = setTimeout(function () {
				timeout = null;
			}, wait)
			if (callNow) func.apply(context, args)
		} else {
			timeout = setTimeout(function () {
				func.apply(context, args)
			}, wait);
		}
	}
}
/**
 * @desc 函数节流
 * @param func 函数
 * @param wait 延迟执行毫秒数
 * @param type 1 表时间戳版，2 表定时器版
 */
function _throttle(func, wait, type) {
	var previous = 0;
	var timeout;
	type = type || 1;
	return function () {
		var context = this;
		var args = arguments;
		if (type === 1) {
			var now = Date.now();

			if (now - previous > wait) {
				func.apply(context, args);
				previous = now;
			}
		} else if (type === 2) {
			if (!timeout) {
				timeout = setTimeout(function () {
					timeout = null;
					func.apply(context, args);
				}, wait);
			}
		}
	}
}