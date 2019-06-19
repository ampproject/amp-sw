/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

import { serializeObject } from '../../src/builder/serialize';

describe('serializeObject', () => {
  it('should serialize given object with regexp', () => {
    const obj = {
      regexp: [/http:\/\/google.com\//, /https:\/\/cdn.ampproject.org/],
    };
    const serializedValue = serializeObject(obj);
    expect(obj).to.deep.equal(
      wrapSerializedValueIntoFunction(serializedValue)(),
    );
  });
  it('should serialize given object with mixed data types', () => {
    const obj = {
      regexp: [1, '2', /a/g],
    };
    const serializedValue = serializeObject(obj);
    expect(obj).to.deep.equal(
      wrapSerializedValueIntoFunction(serializedValue)(),
    );
  });
  it('should serialize object within objects', () => {
    const obj = {
      child: {
        key: {
          subkey: 'value',
          indexes: [0, 4, 5],
        },
      },
    };
    const serializedValue = serializeObject(obj);
    expect(obj).to.deep.equal(
      wrapSerializedValueIntoFunction(serializedValue)(),
    );
  });
  it('should serialize arrays', () => {
    const obj = [
      {
        key: {
          subkey: 'value',
          indexes: [0, 4, 5],
        },
      },
    ];
    const serializedValue = serializeObject(obj);
    expect(obj).to.deep.equal(
      wrapSerializedValueIntoFunction(serializedValue)(),
    );
  });
});

function wrapSerializedValueIntoFunction(serializedValue) {
  return eval(`() => {return ${serializedValue}}`);
}
