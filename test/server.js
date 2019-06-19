/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as http from 'http';
import handler from 'serve-handler';

const createServer = () =>
  http.createServer((request, response) => {
    request
      .addListener('end', async () => {
        //
        // Serve files!
        //
        await handler(request, response, {
          cleanUrls: false,
        });
      })
      .resume();
  });

const startServer = (server, port) =>
  new Promise(resolve => {
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      resolve();
    });
  });

export { createServer, startServer };
