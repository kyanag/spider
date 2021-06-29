# 爬虫框架

## 运行
```
git clone https://github.com/kyanag/spider.git
cd ./spider/
npm install
npm run build
npm run start jiandan        //jiandan 可替换为 sites 里的其他文件名
```

## 概述
```
//先定义一个 Config, 包含目标网站的一些规则， 参考自带的 *./sites/jiandan.ts*
let spider = new App(config)
spider.run()

//参考main.js
```


## 开发 - 站点属性

> id

**string类型**
```
站点标识符,可以理解为名称
举例:
 'id' => "煎蛋"
```
 

> queue

**Queue 类型, 参考 [global.d.ts](./src/global.d.ts)**
```
队列，存放待抓取列表
举例:
 'queue' => new Array<Resource>()
```

> max_retry_num

**Number 类型**
```
最大重试次数
举例:
 'max_retry_num' => 5
```
