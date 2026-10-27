/**
 * 接口限流配置,计数法。
 */

exports.v20160818 = {
    customer: {
        getTemplate:{
            rateCount: '20'
        },
        insert:{
            rateCount: '20', //每分钟20次
            resultCount: '500' //每次插入最多500条
        },
        update:{
            rateCount: '20'
        },
        select:{
            rateCount: '20',
            resultCount: '1000'
        },
        delete:{
            rateCount: '10',
            resultCount: '500'
        }
    },

    webChat: {
        queryWebchatSession:{
            rateCount: '20',
            resultCount: '1000'
        },
        queryWebchatMessage:{
            rateCount: '20'
        }
    }
};