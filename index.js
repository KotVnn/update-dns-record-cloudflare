const axios = require('axios');
const data = require('./config.json');
let ip;

const updateIp = async () => {
    for (const el of data) {
        const id = await getZone(el);
        await getDnsZone(el.token, id, el);
    }
}

const updateDns = (token, zoneId, id, domain) => {
    const data = JSON.stringify({
        content: ip,
        name: domain,
        type: 'A',
        proxied: true
    });

    const config = {
        method: 'put',
        maxBodyLength: Infinity,
        url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        data : data
    };
    //
    const rs = req(config);
    if (rs) showLog(`Update ${domain} to ${ip} successfully.`);
    else console.error(domain, 'Update fail !');
}

const getDnsZone = async (token, id, el) => {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.cloudflare.com/client/v4/zones/${id}/dns_records`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }
    };
    const rs = await req(config);
    if (rs && rs.result && rs.result.length) {
        for (const item of rs.result) {
            if (el.record.indexOf(item.name) !== -1) await updateDns(token, id, item.id, item.name);
        }
    }
}

const getZone = el => {
    return new Promise(async resolve => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.cloudflare.com/client/v4/zones',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${el.token}`,
            }
        };

        const rs = await req(config);
        if (rs && rs.result && rs.result.length) {
            for (const item of rs.result) {
                if (item.name === el.domain) return resolve(item.id);
            }
            return resolve(null);
        }
        return resolve(null);
    })
}

const restartVal = val => {
    clearInterval(val);
    setTimeout(() => {
        getExternalIp();
    }, 10000);
}

const showLog = mess => {
    console.log(new Date().toLocaleDateString(), new Date().toLocaleTimeString(), mess);
}

const getExternalIp = () => {
    const val = setInterval(async () => {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://api.myip.com',
            headers: {'content-type': 'application/json'}
        };
        const obj = await req(config);
        showLog(JSON.stringify(obj));
        if (obj && obj.ip) {
            if (!ip) {
                ip = obj.ip;
                await updateIp();
            } else {
                if (ip !== obj.ip) {
                    ip = obj.ip;
                    await updateIp();
                }
            }
        } else {
            restartVal(val);
        }
    }, 10000);
}

const req = config => {
    return new Promise(resolve => {
        axios.request(config)
            .then((response) => {
                return resolve(response.data);
            })
            .catch((error) => {
                console.log('url', config.url, error.message);
                return resolve(null);
            });
    })
}

getExternalIp();