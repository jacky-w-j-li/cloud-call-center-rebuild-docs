# elasticsearch部署文档

## 环境准备

- java版本1.8


- es版本2.4.0 [https://www.elastic.co/downloads/elasticsearch](https://www.elastic.co/downloads/elasticsearch)
- ik分词插件版本1.10.0 [https://github.com/medcl/elasticsearch-analysis-ik/releases](https://github.com/medcl/elasticsearch-analysis-ik/releases) 解压至`elasticsearch/plugins/ik`目录下

## 修改配置文件

修改`config/elasticsearch.yml`文件

- cluster.name
- node.name
- path.data
- path.logs
- bootstrap.memory_lock
- network.host

修改`bin/elasticsearch`文件，添加以下几行：

```sh
# set JAVA_HOME
JAVA_HOME=/opt/jdk1.8.0_77
# set JAVA_OPTS 允许root用户启动
JAVA_OPTS="$JAVA_OPTS -Des.insecure.allow.root=true"
# set MEMEORY 设置最大/小内存，根据机器配置调整
ES_MIN_MEM=1g
ES_MAX_MEM=6g
```

在后台以守护进程模式运行`bin/elasticsearch -d`

## 启动后新建索引

启动之后需要新建索引及mapping，新建`mapping.json`文件

```json
{
  "mappings": {
    "_default_": {
      "_source": {
        "enabled": true
      },
      "_all": {
        "enabled": false
      },
      "properties": {
        "account": {
          "type": "string",
          "index": "not_analyzed"
        },
        "sessionId": {
          "type": "string",
          "index": "not_analyzed"
        },
        "from": {
          "type": "string",
          "index": "not_analyzed"
        },
        "message": {
          "type": "string",
          "term_vector": "with_positions_offsets",
          "analyzer": "ik_max_word"
        }
      }
    }
  }
}
```

使用以下命令

```
curl -XPUT http://localhost:9200/app_kefu_im_message --data-binary @mapping.json
```

