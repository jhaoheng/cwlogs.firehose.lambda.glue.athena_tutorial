const zlib = require('zlib');

exports.handler = (event, context, callback) => {
  const output = event.records.map((record) => {
    const buf = zlib.gunzipSync(Buffer.from(record.data, 'base64'));
    const cwlogs = buf.toString('utf-8');

    return {
      recordId: record.recordId,
      result: 'Ok',
      data: Buffer.from(cwlogs, 'utf8').toString('base64'),
    };
  });
  callback(null, { records: output });
};