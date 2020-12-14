/*! epg-focus v2.3.3 | (c) epg focus system | by XUZHEN https://gitee.com/ywwxly/epg-focus /license */
window.runTime = null;
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
    this._hasLayer = options.hasLayer || this._hasLayer; //是否有弹窗 有弹窗则必须设置group
    var contentName = location.pathname;
    var pathname = contentName.split("/")[contentName.split("/").length - 1];
    contentName = pathname.slice(0, pathname.indexOf(".")); //去除.html
    this.pathname = contentName; //当前页焦点记录标识
    this.animateHas = options.animateHas;
    this.initNoFocus = options.initNoFocus;
    // if (options.animateHas) {
    //     try {
    //         //css不支持transition 使用
    //         this.animateHas = !SupportCss('transition');
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    this.init();
}
iptvFocus.prototype = {
    version: "^2.3.3", //版本号
    keyEvent: true, //响应按键开关 默认true打开
    focusClassScale: 1.1, //聚焦class scale放大比例
    visualMargin: 30, //可视边距大小  px
    viewEle: evm.$("view") || document.body, //可视移动元素
    _nowEle: null, //当前聚焦元素
    _group: "column", //默认聚焦group
    _hasLayer: false, //是否有弹窗
    _groupList: null, //聚焦组集合
    _foucsList: null, //可聚焦元素集合
    pathname: null, //当前页焦点记录标识
    oldEleObj: null, //上次聚焦对象 
    defaultFocus: null, //临时保存组的默认聚焦对象
    animateHas: false, //js实现变速移动动画 默认关闭
    initNoFocus: false, //初始化时不自动聚焦
    //获取目标属性的数组
    getAttributeEle: function (Attribute, rootEles, groupName, TagName) {
        rootEle = (rootEles || document).getElementsByTagName(TagName || "*");
        var focusEle = [];
        var rootEleObj = Object.values(rootEle);
        var groupFocusIndex = 0;
        for (var index = 0; index < rootEleObj.length; index++) {
            var item = rootEleObj[index];
            if (item.nodeType == 1) {
                if (item.hasAttribute(Attribute)) { //查找可聚焦元素并添加
                    // var isLayer = item.hasAttribute("isLayer");
                    var eventString = item.getAttribute(Attribute);
                    var obj = {
                        index: index,
                        focusIndex: groupFocusIndex, //该组下聚焦索引值
                        ele: item,
                        focus: eventString,
                        groupName: groupName,
                        // isLayer: isLayer
                    };
                    if (eventString) {
                        var eventJavaScript = stringToJavascript(eventString);
                        if (typeof eventJavaScript == "function") {
                            obj.focus = eventJavaScript;
                        }
                    }
                    if (item.hasAttribute("default-focus")) { //获取默认聚焦对象
                        if (!this._nowEle) {
                            this._nowEle = obj;
                        }
                        //临时保存组的默认聚焦对象
                        this.defaultFocus = obj;
                    }
                    //获取绑定的虚拟事件
                    this.getEventAttribute(item, obj, ["blur", "left", "right", "up", "down", "click", "back"]);
                    focusEle.push(obj);
                    groupFocusIndex++;
                }
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
            if (item.nodeType == 1) {
                if (item.hasAttribute(Attribute)) {
                    var AttributeObj = {};
                    var obj = {};
                    var AttributeName = item.getAttribute(Attribute) || index;
                    if (typeof AttributeName == "string" && AttributeName.indexOf("}") > -1) { //判断group中传递是否为对象形式
                        AttributeObj = stringToJavascript(AttributeName); //解析为对象
                        AttributeName = AttributeObj.name || index;
                        getGroupEventAttribute(AttributeObj, obj, "focus");
                        getGroupEventAttribute(AttributeObj, obj, "blur");
                    }
                    obj[Attribute + "Name"] = AttributeName;
                    obj[Attribute + "Ele"] = item;
                    obj.foucsList = this.getAttributeEle("isfocus", item, AttributeName); //获取该group下的可聚焦对象
                    if (this.defaultFocus) {
                        //有默认聚焦对象则保存
                        obj.defaultFocus = this.defaultFocus;
                        this.defaultFocus = null;
                    }
                    //获取绑定的虚拟事件
                    this.getEventAttribute(item, obj, ["left", "right", "up", "down", "click", "back"]);
                    focusEle[AttributeName] = obj;
                }
            }
        }
        return focusEle;
        //获取组事件
        function getGroupEventAttribute(AttributeObjs, objArm, Attributes) {

            if (AttributeObjs[Attributes]) { //group对象中聚焦方法或className
                var eventJavaScript = stringToJavascript(AttributeObjs[Attributes]);
                if (eventJavaScript) {
                    objArm[Attributes] = eventJavaScript;
                } else {
                    objArm[Attributes] = AttributeObjs[Attributes];
                }
            }
        }
    },
    /**
     * 遍历元素的虚拟事件
     * @param {elementObject} Obj  目标元素
     * @param {object} setObj  要赋值的对象
     * @param {string/array} Attributes  //目标属性
     */
    getEventAttribute: function (Obj, setObj, Attributes) {
        if (typeof Attributes == "string") { //如果是字符串
            if (Obj.nodeType == 1 && Obj.hasAttribute("@" + Attributes)) {
                var eventString = Obj.getAttribute("@" + Attributes);
                if (eventString) {
                    var eventJavaScript = stringToJavascript(eventString);
                    // console.log(eventJavaScript, "-------eventJavaScript");
                    if (typeof eventJavaScript == "function") {
                        setObj[Attributes] = eventJavaScript;
                    } else {
                        setObj[Attributes] = eventString;
                    }
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
        if (!this._hasLayer) { //是否有弹窗
            var allFocus = this.getAttributeEle("isfocus", null, "no");
            if (groupList.length != allFocus.length) {
                var noFocus = [];
                //查找未定义group的聚焦元素 
                for (var s = 0; s < allFocus.length; s++) {
                    if (exist(allFocus[s], focusList)) {
                        noFocus.push(allFocus[s]);
                    }
                }
                focusList = focusList.concat(noFocus);
                if (noFocus.length > 0) {
                    this._groupList.no = {
                        groupName: "no",
                        groupEle: null,
                        foucsList: noFocus
                    };
                }
            }
        }

        function exist(num, arr1) {
            for (var j = 0; j < arr1.length; j++) {
                if (num.ele === arr1[j].ele) {
                    return false; //如果传过来的元素在arr1中能找到相匹配的元素，我们返回fasle
                }
            }
            return true; //如果不能找到相匹配的元素，返回true
        }
        return focusList;
    },
    /**
     * 查找并返回目标对象
     * @param {String/Object } tag 要查找的DOM元素或id，或元素对象的索引值
     * @param {Array} focusList  //在focusList查找
     * @param {String} type  //通过focusIndex查找
     */
    findFocusEle: function (tag, focusList, type) {
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
                if (type == "focusIndex") {
                    if (tag == item.focusIndex) {
                        toEle = item;
                        break;
                    }
                } else {
                    if (tag == item.index) {
                        toEle = item;
                        break;
                    }
                }
            }

        }
        return toEle;
    },
    /**
     * 
     */
    focusGroup: function (group, focusIndex) {
        // console.log(this._groupList);
        //优先聚焦指定 当目标组中有可聚焦元素时
        if (this._groupList[group] && this._groupList[group].foucsList.length > 0)
            if (focusIndex) {
                this.onFocus(this.findFocusEle(focusIndex, this._groupList[group].foucsList));
            } else {
                this.onFocus(this._groupList[group].defaultFocus || this._groupList[group].foucsList[0]);
            }
    },
    /**
     * 初始化
     * 获取各group聚焦元素，聚焦方法或className，各事件
     */
    init: function () {
        this._groupList = this.getAttributeObj("group");
        this._foucsList = this.getAllFocusList();
        var focusIndex = evm.cookie(this.pathname);
        if (focusIndex) { //优先焦点记录
            focusIndex = focusIndex.split("-");
            this._nowEle = this.findFocusEle(focusIndex[1], this._groupList[focusIndex[0]].foucsList);
        }
        this._nowEle = this._nowEle || this._groupList[this._group].foucsList[0];
        if (!this.initNoFocus)
            this.onFocus(this._nowEle);
        //console.log(this._groupList, this._foucsList, this._nowEle);
        runTime = new Date().getTime() - runTime;
        //console.log(runTime, "----------runTime");
    },
    /**
     * 设置目标对象为聚焦状态
     * @param {Object} newEleObj  目标对象 必填
     * @param {Object} oldEleObj  失焦对象 非必填 默认为上次聚焦对象
     */
    onFocus: function (newEleObj, oldEleObj) {
        this.onBlur(oldEleObj);
        this._nowEle = newEleObj;
        var eleFocus = newEleObj.focus;
        this._group = newEleObj.groupName;
        //console.log(this._group, newEleObj, "---------------this._group");
        if (eleFocus) {
            if (typeof eleFocus == "function") {
                //eleFocus(newEleObj);
                this.callFn(eleFocus, newEleObj, this._group);
            } else {
                evm.addClass(newEleObj.ele, eleFocus);
            }
        } else {
            var groupFocus = this._groupList[this._group].focus;
            if (groupFocus) {
                if (typeof groupFocus == "string") {
                    evm.addClass(newEleObj.ele, groupFocus);
                } else {
                    //groupFocus(newEleObj);
                    this.callFn(groupFocus, newEleObj, this._group);
                }
            } else {
                evm.addClass(newEleObj.ele, "focus_btn");
            }
        }
        // runTime = new Date().getTime() - runTime;
        // console.log(runTime, "----------moveE");
    },
    /**
     * 设置目标对象为失焦状态
     * @param {Object} oldEleObj  目标对象 必填
     *
     */
    onBlur: function (oldEleObj) {
        oldEleObj = oldEleObj || this._nowEle;
        var oldGroup = oldEleObj.groupName;
        var eleBlur = typeof oldEleObj.focus != "function" ? oldEleObj.focus : oldEleObj.blur;
        if (oldEleObj) {
            //console.log(oldEleObj, "----------------------------oldEleObj");
            if (eleBlur) {
                if (typeof eleBlur == "function") {
                    this.callFn(eleBlur, oldEleObj, oldGroup);
                } else {
                    evm.removeClass(oldEleObj.ele, eleBlur);
                }
            } else {
                var oldGroupBlur = this._groupList[oldGroup].blur;
                if (oldGroupBlur) {
                    if (typeof oldGroupBlur == "string") {
                        evm.removeClass(oldEleObj.ele, oldGroupBlur);
                    } else {
                        this.callFn(oldGroupBlur, oldEleObj, oldGroup);
                    }
                } else {
                    var oldGroupFocus = "";
                    if (this._groupList[oldGroup]) {
                        if (this._groupList[oldGroup].focus) {
                            oldGroupFocus = this._groupList[oldGroup].focus;
                        }
                    }

                    evm.removeClass(oldEleObj.ele, (typeof oldEleObj.focus == "string" ? oldEleObj.focus : '') || oldGroupFocus || "focus_btn");
                }
            }
            this.oldEleObj = oldEleObj;
        }
    },
    saveFocusIndex: function (obj) {
        obj = obj || this._nowEle;
        //console.log(this.pathname, "---------------contentName");
        if (obj) {
            evm.cookie(this.pathname, obj.groupName + "-" + obj.index);
        }
    },
    /**
     * 优先获取元素私有方法或私有聚焦对象
     * @param {String} dir 移动方向 
     */
    _dirKey: function (dir) {
        var dirFun = this._nowEle[dir];
        if (dirFun) { //元素点击事件
            if (typeof dirFun == "function") {
                //dirFun(this._nowEle);
                this.callFn(dirFun, this._nowEle, this._nowEle.groupName);
            } else {
                this.onFocus(this.findFocusEle(dirFun));
            }
        } else {
            this.move(dir);
        }
    },
    /**
     * 优先获取元素私有方法或私有聚焦对象
     * @param {String} dos 返回或确定
     */
    _doKey: function (dos) {
        if (this._nowEle[dos]) { //元素点击事件
            //this._nowEle[dos]();
            this.callFn(this._nowEle[dos], this._nowEle, this._nowEle.groupName);
        } else if (this._groupList[this._nowEle.groupName][dos]) {
            //this._groupList[this._nowEle.groupName][dos](this._nowEle);
            this.callFn(this._groupList[this._nowEle.groupName][dos], this._nowEle, this._nowEle.groupName);
        } else {
            //全局返回方法
            //console.log(dos, this._nowEle, "------------全局方法");
            if (dos == "back" && typeof BackParent == "function") {
                //返回
                BackParent();
            }
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
        //返回清除聚焦记录
        evm.cutCookie(this.pathname);
        this._doKey("back");
    },
    /**
     * OK键
     * @param {object} item  点击的元素对象
     */
    _enter: function () {
        this.saveFocusIndex();
        this._doKey("click");
    },
    /**
     * 解析属性值中的方法并并调用
     * 
     * @param {function} fn  目标方法
     * @param {object} obj  传入的聚焦对象
     * @param {string} areaObj 对应groupName 的group移动对象
     */
    callFn: function (fn, obj, areaObj) {
        var fnName = functionName(fn);
        if (fnName) {
            fn(obj, this.oldEleObj);
        } else {
            var that = stringToJavascript(areaObj);
            fn.call(that, obj, this.oldEleObj);
        }
    },
    /**
     * 遍历目标方向的最近元素
     * @param {String} keyDir move 方向
     * @param {Array} foucsList  聚焦数组
     * @param {String}} type 是否为未找到
     */
    move: function (keyDir, foucsList, type) {
        var hasMinObj = this.findMin(keyDir, foucsList);
        if (hasMinObj.hasMin) { //目标group中该方向无可聚焦元素 并且不是自身
            var oldEle = this._nowEle;
            if (keyDir === "left" || keyDir === "right") {
                this._nowEle = hasMinObj.min; //优先显示上下离地近的
            } else if (keyDir === "up" || keyDir === "down") {
                this._nowEle = hasMinObj.pref || hasMinObj.min;
            }
            this.moveScroll(keyDir, oldEle);
            this.onFocus(this._nowEle, oldEle);
            return this._nowEle;
        } else {
            //目标group中该方向无可聚焦元素时 查找自定义切换目标group的groupName
            // console.log(this._groupList[this._group][keyDir], "-----------this._groupList[this._group][keyDir]");
            if (this._groupList[this._group][keyDir]) {
                var groupName = this._groupList[this._group][keyDir];
                if (typeof groupName == "function") {
                    //优先执行组对象绑定的方法
                    this.callFn(this._groupList[this._nowEle.groupName][keyDir], this._nowEle, this._nowEle.groupName);
                } else {
                    this.concatGroupFocus(groupName, keyDir);
                }
            } else if (type != "noGroup" && !this._hasLayer) { //是否有弹窗 全局搜索
                this.move(keyDir, this._foucsList, "noGroup");
            }
            return;
        }
    },
    //检索元素
    findMin: function (keyDir, foucsList) {
        var pDvalue, mDvalue, pref, min;
        foucsList = (foucsList || this._groupList[this._group].foucsList);
        for (var i = 0; i < foucsList.length; i++) {
            var items = foucsList[i];
            var rule = this.rules(this._nowEle, items, pDvalue, mDvalue, keyDir);
            pDvalue = rule.pDvalue;
            mDvalue = rule.mDvalue;
            rule.pref && (pref = items);
            rule.min && (min = items);
        }
        return {
            hasMin: (pref || min) && (pref != this._nowEle && min != this._nowEle),
            pref: pref,
            min: min
        };
    },
    //合并两组后自动聚焦
    concatGroupFocus: function (groupName, keyDir) {
        console.log(groupName, keyDir, "concatGroupFocus");
        console.log(this._groupList[groupName].foucsList);
        if (this._groupList[groupName] && this._groupList[groupName].foucsList.length > 0)
            this.move(keyDir, this._groupList[this._group].foucsList.concat(this._groupList[groupName].foucsList));
    },
    //可视区域自适应
    moveScroll: function (keyDir, oldEle) {
        var that = this;
        var moveEle = this._groupList[this._nowEle.groupName].groupEle;
        if (!moveEle) {
            moveEle = this._nowEle.ele.parentElement;
        }
        if (!moveEle) {
            moveEle = this.viewEle;
        }
        var moveRect = this.getBoundingClientRect(moveEle);
        var focusEleRect = this.getBoundingClientRect(this._nowEle.ele);
        var oldEleRect = oldEle ? this.getBoundingClientRect(oldEle.ele) : {
            x: focusEleRect.width - this.visualMargin,
            y: focusEleRect.height - this.visualMargin
        };
        var X, Y;
        var viewEleRect = this.getBoundingClientRect(moveEle.parentElement || this.viewEle);
        var focusY = keyDir === "up" ? focusEleRect.y - viewEleRect.y : focusEleRect.y - viewEleRect.y + focusEleRect.height;
        var focusX = keyDir === "left" ? focusEleRect.x - viewEleRect.x : focusEleRect.x - viewEleRect.x + focusEleRect.width;
        var MaxTop = viewEleRect.height || 720;
        var MaxLeft = viewEleRect.width || 1280;
        //console.log(focusX, MaxLeft);
        // console.log(moveEle, focusEleRect, viewEleRect, this.getBoundingClientRect(moveEle), "--------");
        if (focusY >= MaxTop) { //Y轴超出可视大小
            if (keyDir === "left" || keyDir === "right") { //左右方向移动 屏蔽Y轴方向逻辑的
                if (oldEle)
                    this._nowEle = oldEle;
            } else {
                var hasMinObj = this.findMin(keyDir, this._groupList[this._nowEle.groupName].focusList);
                if (!hasMinObj.hasMin) {
                    Y = moveRect.y - viewEleRect.y + (MaxTop - this.visualMargin) - focusY;
                } else {
                    Y = (moveRect.y > this.visualMargin ? moveRect.y : moveRect.y - this.visualMargin) - viewEleRect.y + (MaxTop - this.visualMargin) - focusY;
                }
                animate(moveEle, Y, "top");
                //moveEle.style.top = Y + "px";
            }
        } else if (focusY < 0) {
            var topY = moveRect.y - viewEleRect.y + oldEleRect.y - focusEleRect.y;
            if (topY > 0 && topY < focusEleRect.height) {
                topY = 0;
            }
            if (Math.abs(topY) < this.visualMargin) {
                topY = 0;
            }
            if (topY) {
                var hasMinObj = this.findMin(keyDir, this._groupList[this._nowEle.groupName].focusList);
                if (!hasMinObj.hasMin) {
                    topY = 0;
                }
            }
            //moveEle.style.top = topY + "px";
            animate(moveEle, topY, "top");
            Y = topY;
        }
        if (focusX > MaxLeft) { //X轴超出可视大小
            if (keyDir === "left" || keyDir === "right") {
                X = (moveRect.x > this.visualMargin ? moveRect.x : moveRect.x - this.visualMargin) - viewEleRect.x + (MaxLeft - this.visualMargin) - focusX;
                // moveEle.style.left = X + "px";
                animate(moveEle, X);
            } else {
                if (oldEle)
                    this._nowEle = oldEle;
            }
        } else if (focusX < 0) {
            var topX = moveRect.x - viewEleRect.x + oldEleRect.x - focusEleRect.x;
            if (topX > 0 && topX < focusEleRect.width) {
                topX = 0;
            }
            if (Math.abs(topX) < this.visualMargin) {
                topX = 0;
            }
            if (topX) {
                var hasMinObj = this.findMin(keyDir, this._groupList[this._nowEle.groupName].focusList);
                if (!hasMinObj.hasMin) {
                    topX = 0;
                }
            }
            //moveEle.style.left = topX + "px";
            animate(moveEle, topX);
            X = topX;
        }
        if (typeof moveScroll == "function") { //回调全局事件 监听移动距离做相应操作
            moveScroll({
                keyDir: keyDir,
                X: X,
                Y: Y
            });
        }

        //变速动画
        function animate(element, target, moveType) {
            var nowDate = new Date().getTime();
            var animateOffset = "10_10"; //动画速度
            //console.log(that.animateHas);
            if (that.animateHas) {
                var stepOffset = parseInt(animateOffset.split("_")[0]);
                var stepTime = parseInt(animateOffset.split("_")[1]);
                //清理定时器
                clearInterval(element.timeId);
                element.timeId = setInterval(function () {
                    var spendTime = new Date().getTime() - nowDate;
                    console.log(spendTime);
                    if (spendTime >= 500) {
                        clearInterval(element.timeId);
                        moveTypes(target);
                    } else {
                        //获取元素的当前位置
                        var current = moveType ? element.offsetTop : element.offsetLeft;
                        //移动的步数
                        var step = (target - current) / stepOffset;
                        //7 / 10;
                        //2/1
                        step = step > 0 ? Math.ceil(step) : Math.floor(step);
                        current += step;
                        moveTypes(current);
                        if (Math.abs(current - target) < 10) {
                            moveTypes(target);
                            clearInterval(element.timeId);
                        }
                    }
                }, stepTime);
            } else {
                moveTypes(target);
            }

            function moveTypes(setmove) {
                if (moveType) {
                    element.style.top = setmove + "px";
                } else {
                    element.style.left = setmove + "px";
                }
            }
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
            heihgt = ele.offsetHeight;
        return {
            top: y,
            bottom: y + heihgt,
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
        if (ninfo.width || ninfo.height) { //当元素存在，不为none时
            var tmp, pref, min;
            if (dir === 'up') {
                var upOffset = pinfo.up + (pinfo.height * (this.focusClassScale - 1)) / 2 + 5;
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
                var leftOffset = pinfo.left + (pinfo.width * (this.focusClassScale - 1)) / 2 + 5;
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
        }
        return {
            pDvalue: pDvalue,
            mDvalue: mDvalue,
            pref: pref,
            min: min
        };
    }
};


/**
 * 获取Function的name 兼容写法
 * @param {function} fn 
 */
function functionName(fn) {
    var ret = fn.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
}
/**
 * 字符串转化为Javascript
 * @param {string} string 
 */
function stringToJavascript(string) {
    try {
        return eval("(" + string + ")");
    } catch (error) {
        return false;
    }

}

function getTop(e) {
    var t = e.offsetTop;
    return null != e.offsetParent && (t += getTop(e.offsetParent)),
        t
}

function getLeft(e) {
    var t = e.offsetLeft;
    return null != e.offsetParent && (t += getLeft(e.offsetParent)),
        t
}
/*判断浏览器是否支持某个css属性*/
// function SupportCss(attrName) {
//     var i = 0,
//         arr = ['', '-webkit-', '-Moz-', '-ms-', '-o-'],
//         eleStyle = document.documentElement.style;

//     for (i; i < arr.length; i++) {
//         if (arr[i] + attrName in eleStyle) {
//             return true;
//         }
//     }
//     return false;
// }
window.keyevent = function () {
    var keyobj = iptv;
    if (!keyobj) {
        return;
    } else {
        if (!keyobj.keyEvent && ["KEY_LEFT", "KEY_RIGHT", "KEY_DOWN", "KEY_UP"].indexOf(_keyName) > -1) {
            //屏蔽方向键 保留虚拟事件
            _keyName = "NOTEVENT";
        }
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
            if (typeof mediaEvent == "function") {
                mediaEvent(_keyName);
            }
            break;
    }
};