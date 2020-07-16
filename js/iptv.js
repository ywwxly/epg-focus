function navClick(ele) {
    console.log(ele, "-------nav");
}

function navRecommendClick(ele) {
    console.log(ele, "-------navRecommendClick");
}

function navFocus() {
    console.log("nav-focus");
}


/**
 * iptv聚焦构造函数
 *   isfocus="" 聚焦的class 默认聚焦元素: default-focus 优先级 isfocus>group>全局className;
 * @param {Object} options 
 * {
 * _group,默认聚焦组 string  group="{name:'',focus:''}"; 组的名称 组 内的聚焦函数或className
 * up down left right  虚拟事件 用于强制移动焦点(元素id或元素本身) click 自定义虚拟事件 优先级isfocus>group>全局
 * }
 * 
 */
function iptvFocus(options) {
    options = options || {};
    this.viewEle = options.viewEle || this.viewEle; //可视移动元素
    this._group = options._group || this._group; //默认聚焦组
    this.focusClassScale = options.focusClassScale || this.focusClassScale; //聚焦class scale放大比例
    this._nowEle = options.nowEle || this._nowEle; //默认聚焦元素
    this.visualMargin = options.visualMargin || this.visualMargin; //可视边距大小  px
    this.init();
}
iptvFocus.prototype = {
    version: "1.0.0", //版本号
    focusClassScale: 1.1, //聚焦class scale放大比例
    visualMargin: 30, //可视边距大小  px
    viewEle: evm.$("viwe"), //可视移动元素
    _nowEle: null, //当前聚焦元素
    _group: "recommend", //默认聚焦group
    _groupList: null,
    _foucsList: null,
    //获取目标属性的数组
    getAttributeEle: function (Attribute, rootEles, groupName, TagName) {
        rootEle = (rootEles || document).getElementsByTagName(TagName || "*");
        var focusEle = [];
        var rootEleObj = Object.values(rootEle);
        for (var index = 0; index < rootEleObj.length; index++) {
            var item = rootEleObj[index];
            if (item.hasAttribute(Attribute)) { //查找可聚焦元素并添加
                var obj = {
                    index: index,
                    ele: item,
                    focus: item.getAttribute(Attribute),
                    groupName: groupName
                };
                if (item.hasAttribute("default-focus")) { //获取默认聚焦对象
                    this._nowEle = obj;
                }
                //获取绑定的虚拟事件
                this.getEventAttribute(item, obj, ["left", "right", "up", "down", "click"]);
                focusEle.push(obj);
            }
        }
        return focusEle;
    },
    //获取目标属性的对象形式
    getAttributeObj: function (Attribute, TagName) {
        var rootEle = document.getElementsByTagName(TagName || "*");
        var focusEle = {};
        var rootEleObj = Object.values(rootEle);
        for (var index = 0; index < rootEleObj.length; index++) {
            var item = rootEleObj[index];
            if (item.hasAttribute(Attribute)) {
                var AttributeObj = {};
                var obj = {};
                var AttributeName = item.getAttribute(Attribute) || index;
                if (typeof AttributeName == "string" && AttributeName.indexOf("}") > -1) { //判断group中传递是否为对象形式
                    AttributeObj = eval("(" + AttributeName + ")"); //解析为对象
                    AttributeName = AttributeObj.name || index;
                    if (AttributeObj.focus) { //group对象中聚焦方法或className
                        if (window[AttributeObj.focus]) {
                            obj.focus = window[AttributeObj.focus];
                        } else {
                            obj.focus = AttributeObj.focus;
                        }
                    }
                }
                obj[Attribute + "Name"] = AttributeName;
                obj[Attribute + "Ele"] = item;
                obj.foucsList = this.getAttributeEle("isfocus", item, AttributeName); //获取该group下的可聚焦对象
                //获取绑定的虚拟事件
                this.getEventAttribute(item, obj, ["left", "right", "up", "down", "click"]);
                focusEle[AttributeName] = obj;
            }
        }
        return focusEle;
    },
    /**
     * 遍历元素的虚拟事件
     * @param {elementObject} Obj  目标元素
     * @param {object} setObj  要赋值的对象
     * @param {string/array} Attributes  //目标属性
     */
    getEventAttribute: function (Obj, setObj, Attributes) {
        if (typeof Attributes == "string") { //如果是字符串
            if (Obj.hasAttribute("@" + Attributes)) {
                var eventString = Obj.getAttribute("@" + Attributes);
                if (typeof window[eventString] == "function") {
                    setObj[Attributes] = window[eventString];
                } else {
                    setObj[Attributes] = eventString;
                }
            }
        } else { //如果是数组形式
            for (var i = 0; i < Attributes.length; i++) {
                this.getEventAttribute(Obj, setObj, Attributes[i]);
            }
        }
    },
    /**
     * 合并各group可聚焦元素
     * @param {Array} groupList
     */
    getAllFocusList: function (groupList) {
        var focusList = [];
        groupList = Object.values((groupList || this._groupList));
        for (var i = 0; i < groupList.length; i++) {
            if (groupList[i].foucsList) {
                focusList = focusList.concat(groupList[i].foucsList);
            }
        }
        return focusList;
    },
    /**
     * 查找并返回目标对象
     * @param {String/Object } tag 要查找的DOM元素或id，或元素对象的索引值
     * @param {Array} focusList  //在focusList查找
     */
    findFocusEle: function (tag, focusList) {
        var toEle = null;
        var ele = null;
        focusList = focusList || this._foucsList;
        if (typeof tag == "string") { //是字符串默认为元素id
            ele = document.getElementById(tag);
        } else if (typeof tag == "object") { //DOM元素
            ele = tag;
        }
        for (var i = 0; i < focusList.length; i++) {
            var item = focusList[i];
            if (ele) {
                if (ele == item.ele) { //判断DOM节点是否是同一个
                    toEle = item;
                    break;
                }
            } else {
                //判断聚焦元素对象的索引值
                if (tag == item.index) {
                    toEle = item;
                    break;
                }
            }

        }
        return toEle;
    },
    /**
     * 初始化
     * 获取各group聚焦元素，聚焦方法或className，各事件
     */
    init: function () {
        this._groupList = this.getAttributeObj("group");
        this._nowEle = this._nowEle || this._groupList[this._group].foucsList[0];
        this.onFocus(this._nowEle);
        this._foucsList = this.getAllFocusList();
        console.log(this._groupList, this._foucsList, this._nowEle);
    },
    /**
     * 设置目标对象为聚焦状态
     * @param {Object} newEleObj  目标对象 必填
     * @param {Object} oldEleObj  失焦对象 非必填 默认为上次聚焦对象
     */
    onFocus: function (newEleObj, oldEleObj) {
        oldEleObj = oldEleObj || this._nowEle;
        this._nowEle = newEleObj;
        if (oldEleObj) {
            var oldGroupFocus = "";
            if (this._groupList[oldEleObj.groupName]) {
                if (this._groupList[oldEleObj.groupName].focus) {
                    oldGroupFocus = this._groupList[oldEleObj.groupName].focus;
                }
            }
            evm.removeClass(oldEleObj.ele, oldEleObj.focus || oldGroupFocus || "focus_btn");
        }
        var eleFocus = newEleObj.focus;

        if (eleFocus) {
            evm.addClass(newEleObj.ele, eleFocus);
        } else {
            var groupFocus = this._groupList[this._group].focus;
            if (groupFocus) {
                if (typeof groupFocus == "string") {
                    evm.addClass(newEleObj.ele, groupFocus);
                } else {
                    groupFocus();
                }
            } else {
                evm.addClass(newEleObj.ele, "focus_btn");
            }
        }
    },
    /**
     * 优先获取元素私有方法或私有聚焦对象
     * @param {String} dir 移动方向 
     */
    _dirKey: function (dir) {
        if (this._nowEle[dir]) { //元素点击事件
            if (typeof this._nowEle[dir] == "function") {
                this._nowEle[dir]();
            } else {
                this.onFocus(this.findFocusEle(this._nowEle[dir]));
            }
        } else {
            this.move(dir);
        }
    },
    _down: function () {
        this._dirKey("down");
    },
    _up: function () {
        this._dirKey("up");
    },
    _right: function () {
        this._dirKey("right");
    },
    _left: function () {
        this._dirKey("left");
    },
    _back: function () {
        var dir = "back";
        if (this._nowEle[dir]) { //元素点击事件
            if (typeof this._nowEle.down == "function") {
                this._nowEle[dir]();
            } else {
                this.onFocus(this.findFocusEle(this._nowEle[dir]));
            }
        } else {
            //全局返回方法
            console.log("全局返回方法");
        }
    },
    /**
     * OK键
     * @param {object} item  点击的元素对象
     */
    _enter: function () {
        if (this._nowEle.click) { //元素点击事件
            this._nowEle.click(this._nowEle);
        } else if (this._groupList[this._nowEle.groupName].click) {
            this._groupList[this._nowEle.groupName].click(this._nowEle);
        } else {
            this.enter(this._nowEle);
        }
    },
    move: function (keyDir, foucsList) {
        var pDvalue, mDvalue, pref, min;
        foucsList = (foucsList || this._groupList[this._group].foucsList);
        for (var i = 0; i < foucsList.length; i++) {
            item = foucsList[i];
            //var offset = this.infos(ele);
            //只在可视区域内移动
            // if (offset.left < -100 || offset.top < -100) {
            //     return;
            // }
            var rule = this.rules(this._nowEle, item, pDvalue, mDvalue, keyDir);
            pDvalue = rule.pDvalue;
            mDvalue = rule.mDvalue;
            rule.pref && (pref = item);
            rule.min && (min = item);
        }
        // console.log(pref, min, pDvalue, mDvalue, "----------move");
        if (pref || min) { //目标group中该方向无可聚焦元素
            var oldEle = this._nowEle;
            if (keyDir === "left" || keyDir === "right") {
                this._nowEle = pref;
            } else if (keyDir === "up" || keyDir === "down") {
                this._nowEle = pref || min;
            }
            var focusEleRect = this.getBoundingClientRect(this._nowEle.ele);
            var viewEleRect = this.getBoundingClientRect(this.viewEle);
            var focusY = keyDir === "up" ? focusEleRect.y : focusEleRect.y + focusEleRect.height;
            var focusX = keyDir === "left" ? focusEleRect.x : focusEleRect.x + focusEleRect.width;
            console.log(focusX, focusY, this._nowEle, "-----------------focusX");
            //console.log(focusEleRect.y + focusEleRect.height, focusEleRect.y, focusEleRect.height, "--------");
            if (focusY > 720) { //Y轴超出可视大小
                if (keyDir === "left" || keyDir === "right") { //左右方向移动 屏蔽Y轴方向逻辑的
                    this._nowEle = oldEle;
                } else {
                    this.viewEle.style.top = viewEleRect.y + (720 - this.visualMargin) - focusY + "px";
                }
            } else if (focusEleRect.y < 0) {
                var topY = viewEleRect.y + focusEleRect.height + this.visualMargin;
                if (Math.abs(topY) < 10) {
                    topY = 0;
                }
                this.viewEle.style.top = topY + "px";
            }
            if (focusX > 1280) { //X轴超出可视大小
                if (keyDir === "left" || keyDir === "right") {
                    this._nowEle.ele.parentElement.style.left = this.getBoundingClientRect(oldEle.ele.parentElement).x + (1280 - this.visualMargin) - focusX + "px";
                } else {
                    this._nowEle = oldEle;
                }
            } else if (focusX <= 0) {
                this._nowEle.ele.parentElement.style.left = this.getBoundingClientRect(oldEle.ele.parentElement).x + focusEleRect.width + this.visualMargin + "px";
            }
            this.onFocus(this._nowEle, oldEle);
            return this._nowEle;
        } else {
            //目标group中该方向无可聚焦元素时 查找自定义切换目标group的groupName
            if (this._groupList[this._group][keyDir]) {
                var groupName = this._groupList[this._group][keyDir];
                this._group = groupName;
                this.move(keyDir, this._groupList[this._group].foucsList.concat(this._groupList[groupName].foucsList));
            }
            return;
        }
    },
    /**
     * getBoundingClientRect 获取元素绘图信息
     * @param {Element} ele 
     */
    getBoundingClientRect: function (ele) {
        // if ("getBoundingClientRect" in document.documentElement) {
        //     return ele.getBoundingClientRect();
        // } else if ("getClientRects" in document.documentElement) {
        //     return ele.getClientRects()[0];
        // } else {
        var x = getLeft(ele),
            y = getTop(ele),
            width = ele.offsetWidth,
            heirhgt = ele.offsetHeight;
        return {
            top: y,
            bottom: y + heirhgt,
            left: x,
            right: x + width,
            width: ele.offsetWidth,
            height: ele.offsetHeight,
            x: x,
            y: y,
        };
        //}
    },
    //元素信息
    infos: function (target) {
        var info = this.getBoundingClientRect(target);
        return {
            width: info.width,
            height: info.height,
            left: info.left,
            right: info.left + info.width,
            up: info.top,
            down: info.top + info.height,
            x: info.x,
            y: info.y
        };
    },
    //距离计算
    distance: function (cx, cy, nx, ny) {
        return parseInt(Math.sqrt(Math.pow(cx - nx, 2) + Math.pow(cy - ny, 2)));
    },
    //大小比较
    contains: function (cmin, cmax, nmin, nmax) {
        return (cmax - cmin) + (nmax - nmin) >= Math.max(cmin, cmax, nmin, nmax) - Math.min(cmin, cmax, nmin, nmax);
    },
    //移动规则
    rules: function (oObj, nObj, pDvalue, mDvalue, dir) {
        pinfo = this.infos(oObj.ele);
        ninfo = this.infos(nObj.ele);
        var tmp, pref, min;
        if (dir === 'up') {
            var upOffset = (pinfo.up * this.focusClassScale) + 5;
            if (upOffset >= ninfo.down) {
                tmp = this.distance(ninfo.left, ninfo.up, pinfo.left, pinfo.up);
                (!mDvalue || tmp < mDvalue) && (mDvalue = tmp, min = true);
                (!pDvalue || this.contains(ninfo.left, ninfo.right, pinfo.left, pinfo.right) && tmp < pDvalue) && (pDvalue = tmp, pref = true);
            }
        } else if (dir === 'down') {
            var downOffset = pinfo.down * (2 - this.focusClassScale) - 5;
            if (downOffset <= ninfo.up) {
                tmp = this.distance(ninfo.left, ninfo.up, pinfo.left, pinfo.up);
                (!mDvalue || tmp < mDvalue) && (mDvalue = tmp, min = true);
                (!pDvalue || this.contains(ninfo.left, ninfo.right, pinfo.left, pinfo.right) && tmp < pDvalue) && (pDvalue = tmp, pref = true);
            }
        } else if (dir === 'left') {
            var leftOffset = pinfo.left + (pinfo.width * (this.focusClassScale - 1)) / 2 + 7;
            if (leftOffset >= ninfo.right) {
                tmp = this.distance(ninfo.right, ninfo.up, pinfo.left, pinfo.up);
                (!mDvalue || tmp < mDvalue) && (mDvalue = tmp, min = true);
                (!pDvalue || this.contains(ninfo.up, ninfo.down, pinfo.up, pinfo.down) && tmp < pDvalue) && (pDvalue = tmp, pref = true);
            }
        } else if (dir === 'right') {
            var rightOffset = (pinfo.right * (2 - this.focusClassScale)) - 5;
            if (rightOffset <= ninfo.left) {
                tmp = this.distance(ninfo.left, ninfo.up, pinfo.left, pinfo.up);
                (!mDvalue || tmp < mDvalue) && (mDvalue = tmp, min = true);
                (!pDvalue || this.contains(ninfo.up, ninfo.down, pinfo.up, pinfo.down) && tmp < pDvalue) && (pDvalue = tmp, pref = true);
            }
        }
        return {
            pDvalue: pDvalue,
            mDvalue: mDvalue,
            pref: pref,
            min: min
        };
    }
};
var iptv = new iptvFocus();

window.keyevent = function () {
    var keyobj = iptv;
    if (!keyobj) {
        return;
    }
    switch (_keyName) {
        case "KEY_LEFT":
            if (typeof keyobj._left == "function") {
                keyobj._left();
            }
            break;
        case "KEY_RIGHT":
            if (typeof keyobj._right == "function") {

                keyobj._right();
            }
            break;
        case "KEY_DOWN":
            if (typeof keyobj._down == "function") {
                keyobj._down();
            }
            break;
        case "KEY_UP":
            if (typeof keyobj._up == "function") {
                keyobj._up();
            }
            break;
        case "KEY_ENTER":
            if (typeof keyobj._enter == "function") {

                keyobj._enter();
            }
            break;
        case "KEY_BACK":
            if (typeof keyobj._back == "function") {
                keyobj._back();
            } else {
                BackParent();
            }
            break;
        default:
            break;
    }
};