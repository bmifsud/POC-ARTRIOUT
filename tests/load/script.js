import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 10,
  duration: '5s',
};

export default function () {
  let res = http.get('http://localhost:3000');
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  sleep(1);
}
