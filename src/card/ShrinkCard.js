import React from "react";

import styles from "./ShrinkCard.module.css";

import { joinClasses } from "./../util/elClass.js";

import { SmallCard } from "./../card/SmallCard";

/**
 * +-------------------+
 * | Card outstyle     |
 * |+-----------------+|
 * || ShrinkCard      ||
 * ||+---------------+||
 * ||| Document card |||
 * |||               |||
 * ||+---------------+||
 * |+-----------------+|
 * +-------------------+
 */

export const XsCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={styles.card_xs}>
      {children}
      <div className={styles.fade} />
    </div>
  );
});
