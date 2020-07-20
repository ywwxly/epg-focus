//////////////////////////////////////////////////////////////////////////////////
//封装相关函数类别有：DOM相关操作，常用数据处理,debug,AJAX,cookie. 2018.11.27_徐震
//getData.getobj()，用于获取JSON文件夹下的JSON数据
//////////////////////////////////////////////////////////////////////////////////
var debugs = false; //debug开关判断值
function _classReg(className) {
    return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}
var _isObject = function (obj) {
    return typeof obj == 'object';
};

var _isFunction = function (obj) {
    return typeof obj == 'function';
};

var _isString = function (obj) {
    return typeof obj == 'string';
};

var _isBoolean = function (obj) {
    return typeof obj == 'boolean';
};

var _isNumber = function (obj) {
    return typeof obj == 'number';
};

var _isUndefined = function (obj) {
    return typeof obj == 'undefined';
};
var _isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]' || (obj instanceof Array);
};
/*获取元素的纵坐标*/
function getTop(e) {
    var offset = e.offsetTop;
    if (e.offsetParent != null) {
        offset += getTop(e.offsetParent);
    }
    return offset;
}
/*获取元素的横坐标*/
function getLeft(e) {
    var offset = e.offsetLeft;
    if (e.offsetParent != null) {
        offset += getLeft(e.offsetParent);
    }
    return offset;
}
//元素class操作写法
var _hasClass,
    _addClass,
    _removeClass;

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

function _toggleClass(elem, c) {
    var fn = _hasClass(elem, c) ? _removeClass : _addClass;
    fn(elem, c);
}

var _cssText = function (elem, value) {
    if (typeof value == 'string') {
        if (elem.style.cssText.length == 1 && elem.style.cssText == 'C') {
            var style = value.split(';');
            for (var m = 0; m < style.length; ++m) {
                var item1 = style[m].split(':');
                elem.style[item1[0]] = item1[1];
            }
        } else {
            if (elem.style.cssText.length > 0) {
                elem.style.cssText = elem.style.cssText + value;
            } else {
                var styles = value.split(';');
                for (var i = 0; i < styles.length; ++i) {
                    var item2 = styles[i].split(':');
                    elem.style[item2[0]] = item2[1];
                }
            }
        }
        return true;
    }
};
//删除节点自身
var _removeElem = function (E) {
    if (E && E.parentNode && E.tagName.toLowerCase() !== 'body') {
        E.parentNode.removeChild(E);
        return true;
    }
};

function ajax_xmlhttp() {
    var XmlHttp;
    if (window.ActiveXObject) {
        var arr = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp", "Microsoft.XMLHttp"];

        for (var i = 0; i < arr.length; i++) {
            try {
                XmlHttp = new ActiveXObject(arr[i]);
                return XmlHttp;
            } catch (error) {}
        }
    } else {
        try {
            XmlHttp = new XMLHttpRequest();
            return XmlHttp;
        } catch (otherError) {}
    }
    return XmlHttp;
}
var evm = {
    /////////////////////////////////////////////////////////////////
    //DOM操作方法
    /////////////////////////////////////////////////////////////////

    //获取元素
    $: function (id) {
        return document.getElementById(id);
    },
    //创建元素
    createEle: function (ele) {
        return document.createElement(ele);
    },
    createBadge: function (eLeText, data, callback, parentNode) {
        console.log(parentNode);

        var viewELe = _isObject(parentNode) ? parentNode : evm.$((parentNode || "view")) || document.body;
        var tagImgELe = evm.createEle(eLeText);
        if (typeof callback == "function") {
            callback(tagImgELe);
        }
        evm.css(tagImgELe, data);
        //tagImgELe.style = "position: absolute;left: 770px;top: 160px;";
        viewELe.appendChild(tagImgELe);
    },
    //删除某元素（自身）
    removeElem: _removeElem,
    //css选择：将json形式文本转化成dom操作样式
    css: function (elem, value) {
        if (typeof value == "string") {
            _cssText(elem, value);
        } else if (typeof value == 'object') {
            for (var m in value) elem.style[m] = value[m];
            return true;
        }
    },
    //检查被选元素是否包含指定的 class (Ele,className);
    hasClass: _hasClass,
    //向被选元素添加 class
    addClass: _addClass,
    //移除被选元素中的指定class
    removeClass: _removeClass,
    //给指定的元素添加或者移除类名（如果类名存在则移除，不存在则增加）
    toggleClass: _toggleClass,
    //显示或隐藏class全部的
    $class: function (classe, str) {
        var arr = document.getElementsByClassName(classe);
        for (var i = 0; i < arr.length; i++) {
            arr[i].style.display = str;
        }
    },
    //class全部的边框样式修改
    $classBorder: function (classe, str) {
        var arr = document.getElementsByClassName(classe);
        for (var i = 0; i < arr.length; i++) {
            arr[i].style.border = str;
        }
    },
    //隐藏（性能考虑，优先使用这种）
    hidden: function (id) {
        document.getElementById(id).style.visibility = "hidden";
    },
    //显示（性能考虑，优先使用这种）
    visible: function (id) {
        document.getElementById(id).style.visibility = "visible";
    },
    //显示
    block: function (id) {
        document.getElementById(id).style.display = "block";
    },
    //隐藏
    none: function (id) {
        document.getElementById(id).style.display = "none";

    },
    /////////////////////////////////////////////////////////////////
    //参数，数据操作方法 获取、修改或添加、删除键值对
    /////////////////////////////////////////////////////////////////

    //提取url中某个参数的值,name为键值名 参数2不传，默认为search
    getParameterByName: function (name, url) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        if (!url) {
            url = window.location.search;
        }
        var r = url.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        } else {
            return null;
        }
    },

    //修改或添加location.search中的key=value,参数3不传，默认为search
    changeUrlKV: function (key, val, url) {
        if (!url) {
            url = window.location.search;
        }
        url = decodeURIComponent(url);
        var pattern = key + '=([^&]*)';
        var replaceText = key + '=' + val;
        var urls = url.match(pattern) ? url.replace(eval('/(' + key + '=)([^&]*)/gi'), replaceText) : (url.match('[\?]') ? url + '&' + replaceText : url + '?' + replaceText);
        return urls;
    },
    //删除链接中的某键值对，参数1传入要删除的一个或多个key组成的数组 参数2不传，默认为search
    delUrlParam: function (arrs, url) {
        if (!url) {
            url = window.location.search;
        }
        url = decodeURIComponent(url);
        for (var j = 0; j < arrs.length; j++) {
            url = removeParameter(url, arrs[j]);
            //删除多个重复参数
            while (url.search(eval("/(^\\?|&)" + arrs[j] + "=[^&]*(&)?/g")) > -1) {
                url = removeParameter(url, arrs[j]);
            }
        }
        if (url.length > 0) {
            return url;
        } else {
            return "";
        }

        function removeParameter(str, key) {
            var reg = eval("/(^\\?|&)" + key + "=[^&]*(&)?/g");
            return str.replace(reg, function (p0, p1, p2) {
                return p1 === '?' || p2 ? p1 : '';
            });
        }
    },
    //产生指定数量的不重复随机数,min~max范围,产生num数量（个）
    random: function (min, max, num) {
        if (num > max - min) {
            return false;
        }
        var range = max - min,
            minV = min, //实际上可以取的最小值
            arr = [],
            tmp = "";

        function GenerateANum(i) {
            for (i; i < num; i++) {
                var rand = Math.random();
                tmp = Math.floor(rand * range + minV);

                if (arr.indexOf(tmp) == -1) {
                    arr.push(tmp);
                } else {
                    GenerateANum(i);
                    break;
                }
            }
        }
        GenerateANum(0); //默认从0开始
        return arr;
    },
    //克隆目标对象，而不是指向它
    cloneObject: function (obj) {
        try {
            return parses(stringifys(obj));
        } catch (error) {
            evm.setDebug("cloneObject:" + error);
            return null;
        }

    },
    //数组去重
    arrayUniq: function (arr) {
        var newArr = [];
        for (var i = 0; i < arr.length; i++) {
            if (newArr.indexOf(arr[i]) == -1) {
                newArr.push(arr[i]);
            }
        }
        return newArr;
    },
    /////////////////////////////////////////////////////////////////
    //debug打印与删除 设置、显示隐藏、删除一行
    /////////////////////////////////////////////////////////////////

    //debug打印到页面上 info 传入要debug的字符串
    setDebug: function (info) {
        // if (typeof Authentication != "object") {
        //     return console.log(info);
        // }
        var debugDiv = document.createElement('div');
        debugDiv.style.display = "none";
        var p = document.createElement('p');
        var debug = evm.$('debug');
        if (!debug) {
            document.body.appendChild(debugDiv);
            debugDiv.id = "debug";
            debug = debugDiv;
        }
        debug.style.zIndex = "111";
        debug.style.position = "absolute";
        debug.style.left = "10px";
        debug.style.top = "20px";
        debug.style.backgroundColor = "rgba(28, 37, 69, 0.77)";
        debug.style.color = "#ffffff";
        debug.style.width = document.body.offsetWidth >= 1280 ? "1200px" : "600px";
        debug.style.overflow = "hidden";
        debug.style.textAlign = "left";
        debug.style.wordBreak = "break-all";
        p.innerHTML = 'Debug Print >>> ' + info;
        debug.appendChild(p);
    },
    //显示或隐藏页面上的debug信息
    openDebug: function () {
        if (debugs) {
            evm.none('debug');
            debugs = false;
        } else {
            evm.block('debug');
            debugs = true;
        }
    },
    //删除屏幕最顶部的一个debug日志
    clearDebug: function () {
        evm.removeElem(evm.$("debug").children[0]);
    },
    /////////////////////////////////////////////////////////////////
    //AJAX 回调函数内接收的数据无需做对象转化
    /////////////////////////////////////////////////////////////////
    //参数1：url 参数2：对象格式，参数3回调函数
    post: function (url, datas, callback, error, sendType) {
        // evm.setDebug("进入POST：发送数据为" + stringifys(datas));
        try {
            var request = ajax_xmlhttp();
            var data = datas || null;
            request.open('POST', url, sendType ? false : true);

            request.onreadystatechange = function () {
                // evm.setDebug("进入POST响应request.readyState=" + request.readyState);
                if (request.readyState === 4) {
                    // evm.setDebug("进入POST响应状态request.status=" + request.status);
                    //evm.setDebug("进入POST返回数据" + parses(request.responseText));
                    if (request.status === 200) {
                        //evm.setDebug("进入POST返回数据" + parses(request.responseText));
                        //evm.setDebug("进入POST返回数据(eval解析)" + eval("(" + request.responseText + ")"));
                        //evm.setDebug("进入POST返回数据" + stringifys(parses(request.responseText)));
                        //evm.setDebug("进入POST返回数据(eval解析)" + stringifys(eval("(" + request.responseText + ")")));
                        var type = request.getResponseHeader('Content-Type');
                        if (type.indexOf('xml') !== -1 && request.responseXML) {
                            callback(request.responseXML);
                        } else {
                            callback(parses(request.responseText));
                        }
                    } else {
                        error(request.status);
                    }

                }
            };
            request.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
            request.send(stringifys(data));
        } catch (error) {
            evm.setDebug("进入POST：错误" + error);
        }
    },
    get: function (url, callback, error) {
        var request = ajax_xmlhttp();
        request.open('GET', url, false);
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    var type = request.getResponseHeader('Content-Type');
                    if (type.indexOf('xml') !== -1 && request.responseXML) {
                        callback(request.responseXML);
                    } else {
                        callback(parses(request.responseText));
                    }
                } else {
                    error(request.status);
                }
            }
        };
        request.send(null);
    },
    /////////////////////////////////////////////////////////////////
    //cookie操作方法 evm.cookie只有参数1时，为获取，其它为保存
    /////////////////////////////////////////////////////////////////
    //设置cookie的方法
    cookie: function (c_name, value, expiredays, paths) {
        if (value) {
            var exdate = new Date();
            if (!expiredays) {
                expiredays = 1;
                exdate.setDate(exdate.getDate() + expiredays);
            } else if (expiredays == "30-Minutes") { //特殊字段 30-Minutes 只保存30分钟
                exdate.setMinutes(exdate.getMinutes() + 30);
            }
            document.cookie = c_name + "=" + escape(value) + ";expires=" + exdate.toGMTString() + ";path=" + (paths ? paths : ("/")) + ";";
        } else {
            return evm.getCookie(c_name.toString());
        }
    },
    //获取cookie的方法
    getCookie: function (c_name) {
        //console.log(c_name);
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
};
var hasJD = "";
//聚焦函数
function addFocusEvent(aEle) {
    // console.log(window.event);

    var index = parseInt(aEle.id.split("_")[1]);
    var tag = aEle.parentNode;
    var childrenEle = aEle.children[0];
    //if (typeof Authentication != "object") {
    if (typeof DIYFocusEvent === "function") {
        DIYFocusEvent(tag, index, childrenEle);
    } else {
        evm.addClass(tag, "focus_btn");
    }
    // }
    // move(parseInt(aEle.getAttribute("id").split("_")[1]));
    hasJD = "focus";
    return;
}

function addBlurEvent(aEle) {
    if (hasJD == "focus") {
        var index = parseInt(aEle.id.split("_")[1]);


        var tag = aEle.parentNode;
        var childrenEle = aEle.children[0];
        console.log();
        //if (typeof Authentication != "object") {
        if (typeof DIYBlurEvent === "function") {
            DIYBlurEvent(tag, index, childrenEle);
        } else {
            evm.removeClass(tag, "focus_btn");
        }
        // }
        // evm.setDebug("Obj.addBlurEvent:" + aEle.id);
    }
    return;

}

function addClickEvent(tag) {
    var index = parseInt(tag.id.split("_")[1]);
    evm.setDebug("Obj.onclick:" + tag.id);
    if (typeof DIYClickEvent === "function") {
        DIYClickEvent(index);
    } else {
        clickTo(index);
    }
}

window.onload = function () {
    if (typeof Authentication != "object") {
        document.body.onmouseover = function (keyEvent) {
            keyEvent = keyEvent ? keyEvent : window.event;
            var tag = (keyEvent.srcElement || keyEvent.target).parentNode;
            tag.focus();
        };
    }
    if (typeof loadEnd === "function") {
        loadEnd();
    }
    if (typeof loadEnd1 === "function") {
        loadEnd1();
    }
    if (typeof loadEnd2 === "function") {
        loadEnd2();
    }
};