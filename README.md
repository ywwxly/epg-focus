
# 简介

 EPG聚焦逻辑，采用类Vue模板语法,通过计算聚焦元素距离，判断距离最小值的元素，达到自动聚焦效果.

 由于IPTV机顶盒浏览器内核版本较低且各种魔改内核，js版本尽量采用ECMAScript 3，该项目为的实测兼容的写法,未使用任何打包工具。但并不排除某些低版本魔改内核的不兼容。

## 功能介绍

    iptv上各种逻辑基本可以实现 可制作单页面应用
    - 响应方向按键自动聚焦
    - 超出屏幕元素，可自动移动到屏幕内
    - 可创建弹出层，聚焦逻辑相同
## 使用方法

1. HTML要聚焦的元素父级元素中添加```group```属性,```group```属性值为JSON对象形式

    - 需要传递```{name:'groupName',focus:'className/focusFn'}```
    - name 组名称
    - focus 当前组聚焦className 或聚焦方法
    - 虚拟事件 ```"left", "right", "up", "down", "click"```以```@```开头的属性定义，方向的属性值为要移动组
    ```hasLayer===true``` 必须设置虚拟事件才能切换group

2. HTML要聚焦的元素中添加```isfocus```属性，属性值为真为聚焦className

- ```default-focus```为默认聚焦元素
- 虚拟事件 ```"left", "right", "up", "down", "click"```以```@```开头的属性定义，方向的属性值为要移动的元素id

示例：

```<div id="recommend" group="{name:'recommend',focus:'recommend._focus',blur:'recommend._blur'}" @up="nav"  @click="recommend._enter">```

```<div isfocus class="nav_btn" @click="navRecommendClick">```

```var iptv = new iptvFocus({ focusClassScale: 1.1, //聚焦class scale放大比例 其中聚焦class 有scale放大visualMargin: 30, //可视边距大小  px viewEle: evm.$("viwe"), //可视移动元素 });```

3. ```window.keyevent```为按键监听函数调用

4. 已知问题：
    - ~~未做焦点历史记录~~
    - ~~必须要设置group~~
    - ~~必须设置切换group 虚拟方向事件~~
    - xpath-dom暂未使用（焦点历史记录），兼容性问题考虑暂时不用
后续添加group更加灵活非必须设置，焦点历史记录

### 2020.7.20

1. 增加弹窗```hasLayer```的区分，有弹窗时```group```必设置

2. 增加焦点记录（暂时只用聚焦对象的index索引值，及组名）

3. 增加虚拟事件"back" ：对返回键的监听

4. 增加demo

5. 增加自定义聚焦，失焦方法

### 2020.8.24

1. 增加```group```的自定义blur的方法

2. 修复focus未传入聚焦对象的BUG

### 2020.8.25

1. 修复未查找到未分组的元素对象，no空对象仍在导致```default-focus```指定的默认聚焦对象 移动错误的BUG

2. 返回键时清除聚焦cookie 默认全局检测执行全局返回```BackParent```函数

### 2020.9.24

1. 优化自定义可视窗口内自动调节的逻辑
    - 推荐group父元素为固定可视化窗口

2. 优化元素属性绑定的方法的调用

3. 扩大单页面实用性：逻辑分组处理，自定义不同的移动逻辑

### 2020.10.26

1. ```getAttribute```执行前做```nodeType ==1```（Node.ELEMENT_NODE，元素节点）判断

### 2020.10.29

1. 弹窗切换不同组对象时（focusGroup）,聚焦对象优先级：```聚焦对象id/索引```指定>```default-focus```默认>聚焦对象第一个

### 2020.11.06

1. 修改md文档，版本号语义化

### 2020.11.12 ^2.2.3

1. - ```findFocusEle```函数

        ``` 
        /**
        * 查找并返回目标对象
        * @param {String/Object } tag 要查找的DOM元素或id，或元素对象的索引值
        * @param {Array} focusList  //在focusList查找
        * @param {String} type  //通过focusIndex查找
        */

        ```
        函数新增```type == 'focusIndex'```通过```focusIndex```查找
    - ```move```函数 切换组聚焦对象，时优先执行组对象绑定的方法
2.  - 新增```onBlur```
        ```
        /**
        * 设置目标对象为失焦状态
        * @param {Object} oldEleObj  目标对象 必填
        *
        */
        ```
    - 新增```concatGroupFocus```
        ```
        //合并两组后自动聚焦
        ```
3. 修复```focusGroup```,当目标组中无可聚焦元素时,无法检索的BUG

4. 按键响应回调用于响应媒体事件的全局函数```mediaEvent```

### 2020.11.13 ^2.3.0

1. move中抽离 ```findMin``` 函数 检索元素

2. 优化```moveScroll```函数

3. 增加```animateHas```参数 打开js实现的`"top","left"`变速移动动画（通过先判断css动画属性的方式，优先使用css的方法不通，机顶盒上判断css是支持该动画，但实际无效果）

### 2020.11.26 ^2.3.1

1. 增加`initNoFocus`参数，该值为真初始化时不自动聚焦，用于聚焦时执行部分iptv实例的函数

### 2020.11.26 ^2.3.2

1. 增加`keyEvent`参数，响应按键开关 默认true打开;可用于特殊场景，屏蔽虚拟事件之外的按键事件
