/*! epg-focus v2.3.5 | (c) epg focus system | by ywwxly https://gitee.com/ywwxly/epg-focus /license */
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
window.iptvFocus = function (options) {
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
    this.isMoveScroll = options.isMoveScroll || this.isMoveScroll;
    iptvFocus.prototype.instance = this;
    // if (options.animateHas) {
    //     try {
    //         //css不支持transition 使用
    //         this.animateHas = !SupportCss('transition');
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    this.init();
};

iptvFocus.prototype = {
    version: "^2.3.5", //版本号
    keyEvent: true, //响应按键开关 默认true打开
    focusClassScale: 1.1, //聚焦class scale放大比例
    visualMargin: 30, //可视边距大小  px
    isMoveScroll: true, //超出屏幕是否自动移动
    viewEle: document.getElementById("view") || document.body, //可视移动元素
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
    instance: null, //当前实列
    //获取目标属性的数组
    getAttributeEle: function (Attribute, rootEles, groupName, TagName) {
        var focusEle = [];
        var rootEleObj = (rootEles || document).getElementsByTagName(TagName || "*");
        var groupFocusIndex = 0;
        for (var index = 0; index < rootEleObj.length; index++) {
            var item = rootEleObj[index];
            //中兴BV310 兼容性问题
            // if (item.nodeType == 1) {
            if (item.hasAttribute(Attribute)) { //查找可聚焦元素并添加
                // var isLayer = item.hasAttribute("isLayer");
                var eventString = item.getAttribute(Attribute);
                var obj = {
                    index: index,
                    focusIndex: groupFocusIndex, //该组下聚焦索引值
                    ele: item,
                    focus: eventString,
                    groupName: groupName
                    // isLayer: isLayer
                };
                if (eventString) {
                    var eventJavaScript = this.stringToJavascript(eventString);
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
            // }
        }
        return focusEle;
    },
    //获取目标属性的对象形式
    getAttributeObj: function (Attribute, TagName) {
        var focusEle = {};
        var rootEleObj = document.getElementsByTagName(TagName || "*");
        for (var index = 0; index < rootEleObj.length; index++) {
            var item = rootEleObj[index];
            // if (item.nodeType == 1) {
            if (item.hasAttribute(Attribute)) {
                var AttributeObj = {};
                var obj = {};
                var AttributeName = item.getAttribute(Attribute) || index;
                if (typeof AttributeName == "string" && AttributeName.indexOf("}") > -1) { //判断group中传递是否为对象形式
                    AttributeObj = this.stringToJavascript(AttributeName); //解析为对象
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
            // }
        }
        return focusEle;
        //获取组事件
        function getGroupEventAttribute(AttributeObjs, objArm, Attributes) {

            if (AttributeObjs[Attributes]) { //group对象中聚焦方法或className
                var eventJavaScript = iptvFocus.prototype.stringToJavascript(AttributeObjs[Attributes]);
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
                    var eventJavaScript = this.stringToJavascript(eventString);
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
        this.initFn();
        this._groupList = this.getAttributeObj("group");
        this._foucsList = this.getAllFocusList();
        var focusIndex = this.cookie(this.pathname);
        if (focusIndex) { //优先焦点记录
            focusIndex = focusIndex.split("-");
            this._nowEle = this.findFocusEle(focusIndex[1], this._groupList[focusIndex[0]].foucsList);
        }
        this._nowEle = this._nowEle || this._groupList[this._group].foucsList[0];
        if (!this.initNoFocus)
            this.onFocus(this._nowEle);
        //console.log(this._groupList, this._foucsList, this._nowEle);
        //runTime = new Date().getTime() - runTime;
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
                this.addClass(newEleObj.ele, eleFocus);
            }
        } else {
            var groupFocus = this._groupList[this._group].focus;
            if (groupFocus) {
                if (typeof groupFocus == "string") {
                    this.addClass(newEleObj.ele, groupFocus);
                } else {
                    //groupFocus(newEleObj);
                    this.callFn(groupFocus, newEleObj, this._group);
                }
            } else {
                this.addClass(newEleObj.ele, "focus_btn");
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
                    this.removeClass(oldEleObj.ele, eleBlur);
                }
            } else {
                var oldGroupBlur = this._groupList[oldGroup].blur;
                if (oldGroupBlur) {
                    if (typeof oldGroupBlur == "string") {
                        this.removeClass(oldEleObj.ele, oldGroupBlur);
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

                    this.removeClass(oldEleObj.ele, (typeof oldEleObj.focus == "string" ? oldEleObj.focus : '') || oldGroupFocus || "focus_btn");
                }
            }
            this.oldEleObj = oldEleObj;
        }
    },
    saveFocusIndex: function (obj) {
        obj = obj || this._nowEle;
        //console.log(this.pathname, "---------------contentName");
        if (obj) {
            this.cookie(this.pathname, obj.groupName + "-" + obj.index);
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
        this.cutCookie(this.pathname);
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
        var fnName = this.functionName(fn);
        if (fnName) {
            fn(obj, this.oldEleObj);
        } else {
            var that = this.stringToJavascript(areaObj);
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
            if (this.isMoveScroll) {
                this.moveScroll(keyDir, oldEle);
            }
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
            y: y
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
    },

    /**
     * 获取Function的name 兼容写法
     * @param {function} fn 
     */
    functionName: function (fn) {
        var ret = fn.toString();
        var re = /function\s*(\w*)/i;
        var matches = re.exec(ret); //方法名
        ret = matches[1];
        return ret;
    },
    /**
     * 字符串转化为Javascript
     * @param {string} string 
     */
    stringToJavascript: function (string) {
        try {
            return eval("(" + string + ")");
        } catch (error) {
            return false;
        }

    },
    initFn: function () {
        if (typeof (iPanel) != 'undefined') {
            //去掉默认聚焦效果
            iPanel.focus.borders = '0';
            iPanel.focusWidth = '0';
            iPanel.defaultFocusColor = 'transparent';

        }
        //Object.keys()兼容ES3
        if (!Object.keys) {
            Object.keys = (function () {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({
                        toString: null
                    }).propertyIsEnumerable('toString'),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;

                return function (obj) {
                    if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

                    var result = [];

                    for (var prop in obj) {
                        if (hasOwnProperty.call(obj, prop)) result.push(prop);
                    }

                    if (hasDontEnumBug) {
                        for (var i = 0; i < dontEnumsLength; i++) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
                        }
                    }
                    return result;
                };
            })();
        }

        //Object.values()兼容
        if (!Object.values) {
            Object.values = function (obj) {
                if (obj !== Object(obj))
                    throw new TypeError('Object.values called on a non-object');
                var val = [],
                    key;
                for (key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        val.push(obj[key]);
                    }
                }
                return val;
            };
        }
        //元素class操作写法
        var _hasClass,
            _addClass,
            _removeClass;

        function _classReg(className) {
            return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
        }
        if ('classList' in document.documentElement) {
            _hasClass = function (elem, c) {
                return elem.classList.contains(c);
            };
            _addClass = function (elem, c) {
                elem.classList.add(c);
            };
            _removeClass = function (elem, c) {
                elem.className = elem.className.replace(_classReg(c), ' ');
            };
        } else if ('className' in document.documentElement) {
            _hasClass = function (elem, c) {
                return _classReg(c).test(elem.className);
            };
            _addClass = function (elem, c) {
                if (!_hasClass(elem, c)) {
                    elem.className = elem.className + ' ' + c;
                }
            };
            _removeClass = function (elem, c) {
                elem.className = elem.className.replace(_classReg(c), ' ');
            };
        } else {
            _hasClass = function (elem, c) {
                return _classReg(c).test(elem.getAttribute("class"));
            };
            _addClass = function (elem, c) {
                if (!_hasClass(elem, c)) {
                    elem.setAttribute("class", elem.getAttribute("class") + ' ' + c);
                }
            };
            _removeClass = function (elem, c) {
                elem.setAttribute("class", elem.getAttribute("class").replace(_classReg(c), ' '));
            };
        }
        iptvFocus.prototype.hasClass = _hasClass;
        iptvFocus.prototype.addClass = _addClass;
        iptvFocus.prototype.removeClass = _removeClass;
        document.onkeydown = this.STB_Key;
    },
    cookie: function (c_name, value, expiredays, paths) {
        if (value) {
            var exdate = new Date();
            if (!expiredays) {
                expiredays = 1;
                exdate.setDate(exdate.getDate() + expiredays);
            }
            document.cookie = c_name + "=" + escape(value) + ";expires=" + exdate.toGMTString() + ";path=" + (paths ? paths : ("/")) + ";";
        } else {
            return this.getCookie(c_name.toString());
        }
    },
    //获取cookie的方法
    getCookie: function (c_name) {
        if (document.cookie.length > 0) {
            c_start = document.cookie.indexOf(c_name + "=");
            if (c_start != -1) {
                c_start = c_start + c_name.length + 1;
                c_end = document.cookie.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = document.cookie.length;
                }
                return unescape(document.cookie.substring(c_start, c_end));
            } else {
                return null;
            }
        }
    },
    // 删除 Cookie的方法
    cutCookie: function (name, paths) {
        var expdate = new Date();
        expdate.setTime(expdate.getTime() - (86400 * 1000 * 1));
        document.cookie = name + "=" + ";expires=" + expdate.toGMTString() + ";path=" + (paths ? paths : ("/")) + ";";
    },
    STB_Key: function (keyEvent, that) {
        keyEvent = keyEvent ? keyEvent : window.event;
        var _keyName = "";
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
        iptvFocus.prototype.keyEvents(_keyName, iptvFocus.prototype.instance);
    },
    //按键事件注册 监听_keyName值
    keyEvents: _throttle(function (_keyName, keyobj) {
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
                    this.BackParent();
                }
                break;
            default:
                if (typeof this.mediaEvent == "function") {
                    this.mediaEvent(_keyName);
                }
                break;
        }
    }, 350),

};
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