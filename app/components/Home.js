// @flow
import React, { Component } from 'react';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    let bubbles = [{body: "I'm a message", yours: false}, {body: "I'm another message", yours: true}];
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
            {bubbles.map(({body, yours}) => 
              <div className={[styles.chat_bubble, yours ? styles.yours : styles.theirs].join(' ')}>
                <span>
                {body}
                </span> 
              </div>
            )}
          </div>
          <div className={styles.chat_controls}>
            <input className={styles.chat_input}>
            </input>
            <button className={styles.chat_send}>
            send
            </button>
          </div>
        </div>
      </div>
    );
  }
}
