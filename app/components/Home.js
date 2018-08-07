// @flow
import React, { Component } from 'react';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <div className={styles.left_column}>
          <div className={styles.controls}>
          </div>
          <div className={styles.thread_list}>
          </div>
        </div>
        <div className={styles.right_column}>
          <div className={styles.chat_window}>
            <div className={styles.chat_bubble}>
            </div>  
          </div>
          <div className={styles.chat_controls}>
          <div className={styles.chat_input}>
          </div>
          <div className={styles.chat_send}>
          </div>
          </div>
        </div>
      </div>
    );
  }
}
