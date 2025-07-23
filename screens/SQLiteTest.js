// Test code to see if SQL is working

import React, { useEffect } from 'react';
import { Text, View, Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function SQLiteTest() {
  useEffect(() => {
    console.log('Running on:', Platform.OS); // Check platform

    const db = SQLite.openDatabase('test.db');

    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, name TEXT);');
      tx.executeSql('INSERT INTO test (name) VALUES (?)', ['Alice']);
      tx.executeSql('SELECT * FROM test', [], (_, { rows }) => {
        console.log('DB Rows:', rows._array);
      });
    });
  }, []);

  return (
    <View style={{ padding: 50 }}>
      <Text>SQLite Test</Text>
    </View>
  );
}
