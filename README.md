
# 简介

 EPG聚焦逻辑，采用类Vue模板语法,通过计算聚焦元素距离，判断距离最小值的元素，达到自动聚焦效果.

 由于IPTV机顶盒浏览器内核版本较低且各种魔改内核，js版本尽量采用ECMAScript 3，该项目为的实测兼容的写法,未使用任何打包工具。但并不排除某些低版本魔改内核的不兼容。

## 功能介绍

iptv上各种逻辑基本可以实现 可制作单页面应用

1. 响应方向按键自动聚焦

2. 超出屏幕元素，可自动移动到屏幕内

3. 可创建弹出层，聚焦逻辑相同

4. 功能演示：  
![image text](https://ywwxly.gitee.io/home/video/epg-focus.gif)  

## 使用方法
### 简要

1. HTML要聚焦的元素父级元素中添加```group```属性,```group```属性值为JSON对象形式

    - 需要传递```{name:'groupName',focus:'className/focusFn'}```
    - name 组名称
    - focus 当前组聚焦className 或聚焦方法
    - 虚拟事件 ```"left", "right", "up", "down", "click"```以```@```开头的属性定义，方向的属性值为要移动组
    ```hasLayer===true``` 必须设置虚拟事件才能切换group

2. HTML要聚焦的元素中添加```isfocus```属性，属性值为真为聚焦className

- ```default-focus```为默认聚焦元素
- 虚拟事件 ```"left", "right", "up", "down", "click"```以```@```开头的属性定义，方向的属性值为要移动的元素id

- 示例：  

    ```html
    <div id="recommend" group="{name:'recommend',focus:'recommend._focus',blur:'recommend._blur'}" @up="nav"  @click="recommend._enter">
    ```

    ```html
    <div isfocus class="nav_btn" @click="navRecommendClick">
    ```

    ```javascript
    var iptv = new iptvFocus({ focusClassScale: 1.1, //聚焦class scale放大比例 其中聚焦class 有scale放大visualMargin: 30, //可视边距大小  px viewEle: evm.$("viwe"), //可视移动元素 });
    ```

### 示例

 script引入：

``` html

<script src="/js/iptv.js"></script>
```

可在`group`，`isfocus`自定义聚焦css类、方法
优先级:isfocus自定义方法>isfocus自定义css类>group自定义方法>group自定义css类>默认聚焦css类名`focus_btn`
详细见API及demo演示
原则上超出屏幕元素只在单一方向（纵向/横向），demo演示为了方便，同时展示了两种方向。

#### 1. 不指定聚焦组 默认聚焦组名称为`no`

- html

``` html
  <div class="nav">
        <div isfocus class="focus-div" style="background-color: #5f7712;">
            <p>1</p>
        </div>
        <div isfocus class="focus-div" style="background-color: #776412;">
            <p>2</p>
        </div>
        <div isfocus class="focus-div" style="background-color: #267712;">
            <p>3</p>
        </div>
        <div id="test-left-id" isfocus class="focus-div" style="background-color: #125f77;">
            <p>4</p>
        </div>
  </div>
```

- js

``` javascript
 var iptv = new iptvFocus();
```

#### 2. 指定聚焦组 指定聚焦css类

- html

``` html
 <div id="nav" group="{name:'nav',focus:'nav-focus'}" @down="recommend" @click="nav._enter" class="posit"
            @onFocus="onNavFocus">
            <div id="nav-img-0" @right="nav-img-1" class="posit nav-img" isfocus alt="">栏目1</div>
            <div id="nav-img-1" default-focus class="posit nav-img" isfocus alt="">
                推荐
            </div>
            <div id="nav-img-2" class="posit nav-img" isfocus alt="">栏目3</div>
            <div id="nav-img-3" class="posit nav-img" isfocus alt="">栏目4</div>
</div>
```

- js

``` javascript
var iptv = new iptvFocus({
	_group: "nav",//要与html中的默认组名称对应
	visualMargin: 50,
 });
```

#### 可聚焦元素对象

|  key | value  |  描述 |
| :------------ | :------------ | :------------ |
| ele  |  `[object HTMLElement]` | 可聚焦html元素  |
| focus  |  `Function`/`String` | 自定义聚焦方法或css类名 优先级：`Function`>className  |
| focusIndex  | `Number`  | 当前组可聚焦对象索引（与其它组内的可聚焦对象索引可能相同）  |
| groupName  |  `String`  | 当前所属组名称  |
| index  |  `Number` | 全局可聚焦对象索引  |

3. 根据实际功能需求自行调整,功能演示详情请看demo

------------
## API

[TOC]

### `iptvFocus(options)` 构造函数

- options
构造参数

|  key | 描述  |  默认值 |
| :------------ | :------------ | :------------ |
| keyEvent  |  响应按键开关 默认true打开 | true  |
|  focusClassScale |  聚焦class scale放大比例 | 1.1  |
|  visualMargin |  可视边距大小  px | 30  |
|  isMoveScroll |  超出屏幕是否自动移动 | true  |
|  viewEle |  可视移动元素的根元素 |  document.body  |
|  _group |  聚焦group名称 | column  |
|  _hasLayer |  标识是否有弹窗 有弹窗则聚焦元素必须分组| false  |
|  animateHas |  是否开启js实现变速移动动画 | false  |
|  initNoFocus |  初始化时不自动聚焦 | false  |

------------

### `findFocusEle(tag, focusList, type)` 查找并返回目标对象

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
| tag  |  要查找的DOM元素或id，或元素对象的索引值 | String/Object  | true | [object HTMLElement]/元素id/元素index（从实列中查看） |
|  focusList |  可聚焦元素列表 | Array  | false | 指定的可聚焦元素列表（从实列中获取） |
|  type |  通过focusIndex查找 | String  | false | focusIndex值（从实列中查看）|

return:
可聚焦对象

### `focusGroup(group, focusIndex)` 切换不同组对象聚焦 主要用于弹窗切换

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
|group	| 聚焦元素分组名称 |String |true | 组名称|
| focusIndex |	聚焦索引值/元素ID 聚焦对象优先级：聚焦对象id/索引指定>default-focus默认>聚焦对象第一个|Number|false|聚焦对象id/索引指定|

iptv聚焦构造函数 isfocus="" 聚焦的class 默认聚焦元素: default-focus 优先级 isfocus>group>全局className;

### `resetFocus` 重新获取当前可聚焦元素

### `onFocus` 设置目标对象为聚焦状态

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
| newEleObj  |  目标对象 | Object  | true | _foucsList中的可聚焦对象（findFocusEle也可以生成） |
|  oldEleObj |  可聚焦元素列表 | Array  | false | 指定的可聚焦元素列表（从实列中获取） |

- Event:

|  回调名称 | 描述  |  回调参数 |
| :------------ | :------------ | :------------ |
| onFocus  |  聚焦状态完成回调 | 当前聚焦元素对象，当前聚焦组  |


### `onBlur` 设置目标对象为失焦状态

### `_dirKey` 指定移动方向或方法

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
| dir  |  指定要移动的方向键默认移动方法或自定义方法聚焦 | String  | true | down/up/right/left |

 - `_down` `_up` `_right` `_left` 默认四个方向键默认触发函数

### `_enter` 触发确定/OK键

- 执行方法优先级 聚焦元素的定义的方法>聚焦组的定义的方法

### `_back` 触发回格/返回键

- 执行方法优先级 聚焦元素的定义的方法>聚焦组的定义的方法>全局`BackParent`方法


### `concatGroupFocus` 合并指定聚焦组后自动聚焦

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
| groupName  |  目标组groupName | String  | true | - |
| keyDir  |  移动方向 | String  | true | down/up/right/left |

### `moveScroll` 自适应目标方向在可视区域内

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :------------ | :------------ | :---| :---- |
| keyDir  |  移动方向 | String  | true | down/up/right/left |

- Event:

|  回调名称 | 描述  |  回调参数 |
| :------------ | :------------ | :------------ |
| moveScroll  |  自适应移动后回调 | keyDir：移动方向，X:当前横向位置，Y:当前纵向位置  |

### `hasClass` 检测目标html元素是否包含某className

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| ele  | `[object HTMLElement]`  | Object  | true | - |
| className  |  css类名 | String  | true | - |

### `addClass` 向目标html元素添加某className

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| ele  | `[object HTMLElement]`  | Object  | true | - |
| className  |  css类名 | String  | true | - |

### `removeClass` 删除目标html元素添加某className

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| ele  | `[object HTMLElement]`  | Object  | true | - |
| className  |  css类名 | String  | true | - |

### `cookie` 保存/获取指定数据到本地cookie

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| key  | 保存在cookie中的数据key，value为空时为获取指定key的值  | String  | true | - |
| value  |  要保存的数据 | String  | false | - |
| expireday  |  要保存的时间，默认： 1 | Number  | false | - |
| path  |  要保存的路径 默认：/ | String  | false | - |

### `cutCookie` 删除指定key的cookie

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| key  | 保存在cookie中的数据key  | String  | true | - |
| path  |  要保存的路径 默认：/ | String  | false | - |

### `keyEvents` 按键响应函数

- Parameters:

|  Name | 描述  |  类型 | 必填| 可选值 |
| :------------ | :-------------- | :------------ | :---| :---- |
| _keyName  | 响应的按键字符串  | String  | true | KEY_LEFT/KEY_RIGHT/KEY_DOWN/KEY_UP/KEY_ENTER/KEY_BACK等详见源码 |
| keyobj  |  当前实例 | Object  | false | - |

- Event:
	 在实例上自定义除上述键值外的方法

|  回调名称 | 描述  |  回调参数 |
| :------------ | :------------ | :------------ |
| mediaEvent  |  除上述键值外的方法 | 详见源码  |

------------

## 更新记录

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

### 2020.12.14 ^2.3.3

1. 修复IE9及其以上移动报错的BUG

### 2021.03.25 ^2.3.4

1. 修复部分机顶盒`Element.nodeType`属性兼容问题，导致获取不到聚焦对象的bug

### 2021.04.08 ^2.3.5

1. 添加`isMoveScroll`控制超出屏幕是否自动移动

2. 整合代码，减少对外部js的依赖

3. 丰富demo功能演示

### 2021.09.07 ^2.3.6

1. 调整优化超出屏幕移动逻辑，及移动聚焦逻辑

2. 新增`onFocus`聚焦状态完成时回调

3. 完善注释，增加demo展示

4. 增加接口文档，丰富使用说明
