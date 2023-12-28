# 9girds(知识九宫格)

## 理论原理
根据认知科学,人的工作记忆数量在4~9个之间,也就是依靠大脑一次只能比较轻松记住4-5个知识点.但大多数的知识内容并未按照符合认知科学的方式进行组织,需要在学习记忆的过程中进行归纳和整理.而九宫格是一个很好的符合认知科学原理的辅助归纳整理工具.它的优势体现在以下方面:

### 1.数量
九宫格有九个格子,能够满足绝大多数人的工作记忆数量要求.
而大部分人使用其中3-5个格子可以找到最符合自己需要的记忆模式.

### 2.结构
九宫格自身拥有纵向和横向的两个维度,可以适配不同的知识点结构.
#### 横向排列可以代表时间轴:
![Ar4uyS](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/Ar4uyS.png)

#### 纵向排列可以代表空间轴:
![O7Dyzw](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/O7Dyzw.png)

#### 横轴和纵轴可以同时使用:
![Gw95Qo](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/Gw95Qo.png)

#### 九宫格可以兼容2×2矩阵,用上下左右四个方向代表四种可能性.
![Rg9OeU](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/Rg9OeU.png)

### 3.层次
如果把人的知识体系比作一棵树的话,每个上位的知识点都与下位的若干个知识点相关,这样很容易超出工作记忆处理的能力.
但如果知识树上每个节点都从横向切开就会发现,每个知识点都看做是一个九宫格.它相关的知识为与这个知识点的四周,这样通过一层一层的剖析,就可以逐层掌握知识树.
![nn951S](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/nn951S.png)
![1nEcZy](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/1nEcZy.png)


## 软件功能

基于九宫格工具设计的9grids软件有以下功能:
### 1.快捷录入
点击**加入格子**可以将用户录入的内容要点直接放入九宫格,不需要手动编辑.
![bKopbF](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/bKopbF.png)

### 2.结构梳理
用户可以随意拖动内容要点在九宫格的位置,将每个知识点附加上位置的情境记忆,更准却的掌握内容之间的关系.
比如在波特五力模型中,
供应商→竞争者→客户, 这三者是生产的时间顺序关系
新进入者→竞争者→替代品,这三者是不同空间维度的竞争关系
通过不断地整理调整知识点的相互位置,更容易发现知识要点的内在逻辑关系.
![R0iBcX](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/R0iBcX.png)


### 3.AI查询和梳理
用户只需要输入一个关键词,比如4Ps模型,点击**AI查询**后程序自动调取智谱AI的接口,并将相关信息整理成4-5个知识点,方便用户理解和记忆.
用户也可以直接输入一段文字,点击**AI整理**后程序调用AI接口自动将内容整理成4-5个知识点.

### 4.框架引导
软件提供了一些常用的思考框架并放入到数据库中,用户可以双击将内容导入格子,然后就在每个格子之中进行进一步分析补充.
![lQGe9p](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/lQGe9p.png)

### 5.数据库存储
所有的卡片都可以存储在用户自己的数据库之中,随时调阅复习,也可以随时更新内容.
![NvQOuL](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/NvQOuL.png)

### 6.卡片导出
用户可以将数据库中保存的内容导出为MD格式的卡片,系统会自动附加卡片编写的日期.
![HSX3kF](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/HSX3kF.png)

## 项目地址
https://github.com/biercewang/9grids/tree/9grids_3
![eGI6v7](https://cdn.jsdelivr.net/gh/biercewang/myimage@master/uPic/eGI6v7.png)

## 后续功能增加计划
1.增加卡片大法模板,方便读书笔记使用
2.增加九宫格的层次

## Changelog
20231211-1213
程序主题已基本完成,增加AI辅助总结功能,目前仍在优化,欢迎大家使用并提建议.软件安装包后续补充.

20231215 完成软件打包
使用pytinstaller打包遇到不少困难,数据库文件和配置文件的路径始终搞不定.
最后想到一个办法,不再附加数据库和配置文件,改为在第一次运行的时候生成数据库和配置文件,终于打包成功了,欢迎大家下载试用,目前暂时只支持mac.
https://github.com/biercewang/9grids/releases

20231216 新增三项功能:
增加在首次使用生成数据库时存入模板数据的功能
增加将数据库内容右键导出为md格式并复制到剪贴板功能,方便把总结记录导出到笔记软件中
增加将同主题名项目存入数据库时提醒是否覆盖，如确认则覆盖原有记录

20231218 新增两项功能:
在数据库增加日期字段,可以记录存入数据库的日期.导出MD的时候可以直接输出日期信息.
增加对已经输入的内容通过AI进行进行整理的功能,现在可以直接导入一大段文章让AI整理成4-5个要点.发现配合AI查询功能使用效果更好,可以先查询再整理.

20231219 修改两项功能,学会使用branch
修改prompt模板,适应输入单个词汇或者一段文字
增加全部格子为空时,不执行保存操作
学会了使用Branch进行功能的修改操作

