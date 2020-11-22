import React from "react";

// React router
import { Link } from "react-router-dom";

import {
  Button,
  ButtonGroup,
  Container,
  Image,
  ListGroup,
} from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

import Emoji from "./Emoji";

import user_default_pic from "./user-default-pic.png";

import styles from "./UserEncryption.module.css";

class UserEncryption extends React.Component {
  // pub struct AccountInfo<'a> {
  //     pub uid: &'a str,
  //     pub name: &'a str,
  //     pub email: &'a str,
  // }
  constructor(props) {
    super(props);
    this.axiosCancelToken = axios.CancelToken.source();
    this.state = {
      ckeys: [
        {
          key: "2qL9p2dEIq7",
          value:
            "joA5wa4MgwsnxapxqzKRnrSyC/Ed4aFfTecW7TVzHTJ9t4HxeNjfyVJhnJMhC8Y1N7xiZsRPyTue" +
            "wX1LCUmqqBsVnvMqxqXL96zk+pD2H31FpF5AiKbFspPIQVjuH7X9sQLiElySkMN0Qpt46M4LMXaS" +
            "oj/4+A/2qL9p2dEIq78n64vg5GZQgyokTqHj8aCPTgR9hdqtnCB5itDPw8MtJF3LbRYhI8Whj95T" +
            "qd4R+4YiIphV1ZE0VFft8F324XkC9o1AmW9lDgbLxJEgZigrMa1mI3JQmuRyGMg3q1Z+bnuPYgdd" +
            "yvFWr+73bGIPpnCJFCJAWTBlKIjcA6HVp0QKHQOatIu5okQ/HZVLE3nkc2ER6JEilEC+nLqcG7c5" +
            "fDnFN6YJgEQYG00pbUf8VbHx2mS+ImRjB1yvavxAoEYt6Koyxw/hYKA/tVZ9lN1MYqAwWlt4SdjF" +
            "OGI/EZFNFGUjusBdQ0blhhm34EcbTUrrbI5INt1kwovN/mPDdgBv6AT1+BdtA/W2gmp+SxYBXDcl" +
            "F8EYvCtE38M0VLlVEG27Him+3AVgszK5t8Qrll7hy9sM1CSxy+4+XjDKNuK4FeP4miinzq0mxs5O" +
            "Zn7Zxxqdas/GxqJYr/AAHc8HLVjQ8pP7UoPt7hEDTMRIf1upvUDjt1J4APE0fWfhRq+NuCMVok+2" +
            "ln0Docl4F2Mj85L1JamdlTKFxKaRplzU2yl2JI2TdYk/hHVLBGHTfnZOEnHLtC9Y+iJJAzHNUKvI" +
            "1afEJ1FOE084egawVItjyJCM5YEVSonss5vmIbl/xZfsnITi3cvm7GUO+qT5cUhdK1sOAR9w7LkX" +
            "ALExj+Fc7yJQYnsgRSmYxXtBRc65yT4kD0JDYspvWbZCjeweE5E35yNochfEG5kgkht/iho+hRyY",
        },
        {
          key: "uG+uNHe6qKT",
          value:
            "rqMEQ8UTiKyDJh/L2BbruB/d19yFw5JzEQrKoj+wU619dOQunwcFCu9/hS5Md3DKPUhxHhyuF1jH" +
            "GB6sa82eNRa9IO2aP0qpbwW04xpNPGdHnYtxmZxtA1UTeq0wcZ8PNTB+h6JoS7CBG6AZBvl8LEp9" +
            "cuG+uNHe6qKTn5woqpXL4cX+iB6nc82EzQg3hkrkBAW30Al+pu8l9nDh2pDB6c82eMZlrLCJ7SZT" +
            "wE9DNkflW80ZpR1zxafgHjsJFAC49sfC1oOWNAgbLHmtPRFPxVE1l5XampFvacC7mckhT5jSnBCz" +
            "MkF+T7iHcQ83DALVqweWuG6tq87QA80dGx0K1ZT/OWgsqub0zAE98fHR2CKrTPMrks3+PRtulZe/" +
            "Gby5rWXnnOoUOYM25xjzufRro9IaSMVHn5wSkf5z9HVymdnCpmbKj644wIdrNw/cBsbDuOb6Sps9" +
            "R86bkoLH5+umCksPjSEbLWWystCgA4bbHN0Ca2qr1Vx8DICvAQ3/VmiG1XYpWlHt/P30ylW0nmfP" +
            "6RO4sFj2Pe/5g84uh2hFeL8JLrEV8bLWewV9v6UaCZCLRNyjeQeTNUgjhDy835egN6fUKCnF9jW9" +
            "K/OuddFRn9/BvOEzDCXoOACew79x+N2MrirSjfrCqYmnfRk8N/tSstxhDIbmLm3RWpIj8O1VYWEF" +
            "/7vSlCddLwIkG4Oby5H5FjLDA/ZSmxk4KPrW7MBEfXiFsWzY8ih0CRtJj9Fhg0VFZxopBnK0lRqm" +
            "GlE59Nbq44da831gQYpCoyyg4AfoPs0XISwPR/oCewhr5eXZwIAAnASLXjEFiciWPd36wNZqqMM2" +
            "3wm+AYtNrqN9knWtQb9Wl36k1zONM5SYMOcKAVKLK46YgdjTNcDCzK2NaUgOVwLTQ5fS7y7vaadD" +
            "vAKzj9foXBH1S8YD1APmT7sgV54qKYBzL5SCKwqofIq45I53We/+x/4LHDpqt3dkmJGmnDLNqZ5c" +
            "StpwlBYrGhOYp7r6NUOxiS/UoZsVzToHRhqKV3m3vGQiUoaeHZkA0o1T0JPV/WjJf2bxWulWtAI3" +
            "fIebhqLwQiNRS398s4wBiqB6gou7z+K4zGpiaeTIcMERxrbg68ttcxKKyjsnWtYQwNZX9kPJZzGU" +
            "/n73YdoR6h1we7FVwZYe3o/yWyHFU8j5uuP07M6DDhvotxCJhv+02wkUYQ+8DOTIGXwkvoMRHJTG",
        },
        {
          key: "6MyNmg7ygzj",
          value:
            "6MyNmg7ygzjZ3CTYhO5PPg4CoQ43+RW3lnxdO7f0EUoxNn6/3N8OSSyHKhYOUAE17zSgjCVK5rrS" +
            "awfBSSS3H2Cpwr6ty7JHYk+nD1JjKFx3jPmjNr9jQfUks1EH3QMOx3fMZJgZg5dOCbO0MrKDcvD/",
        },
        {
          key: "YAwf083zWL8",
          value:
            "HQ8zzUvsjHy/YAwf083zWL8ToM2UnaPsJMC8GXl9nxEBpvUFrfcyXeGtGvgywyQYwy7XgSZzEbmL" +
            "Jj232boQJCaFO6NrtF5AMyVcw3CKIZMHOCsjiXz7e4SQ5kE1llUpdPPIUBaSTKFP/bqCa+JIFoGw" +
            "4Hi6df7qJNztguKiLZFGi92gBcW6n+Kj289FHCDr1u2gbiu56+HbF8mG4By8bvp+kahEC3GXAlz8" +
            "JWaRMd9buS+yO5F71B0xhcPfzsF3DvglhCB/Ll0mHlX3spTjd43MJGreNJOnGrl0oPsQkH9kEAvv" +
            "HuEIVaJJZ6rETbD0X6gngs0TNhTrCZAR2vpKw1IZuOEa/jfEfk7CLuJnUKjzmv56jGu0vSFFeAYf" +
            "XyVJUu1ivtosU2365i38LBcYiLsssj/qDSCG/HzgkFnMDQCN/n0lsZIJgqh0S+QUS9r9jG0NqlEI" +
            "63N8E9skxeMg58M1iOCCySLz515wExT4UrfwzxIiSsRy5/W/fJxvweJtPLr/PMYcpQReb7Ubyfdd" +
            "Crs1Mq4lUvCjrMy4nSRB6160enKO9TU/9LUKzioSHIez6deLYnzYrKFABiZDg5QCAYSPMd4W7XPf",
        },
        {
          key: "pzShHY2THcK",
          value:
            "nxQX0+8/Pumo1pzShHY2THcKvPwrvBpHxwbT+7WQatXa3wcENH+fjjnLR5f4uMnk+CMr3cawr32K" +
            "/JSuLEf4uIqh3el8RmrvrCoTU3EV1aT2xiJSBdMLCGVTO6iA3E6UIL3ufux8jFaxnOXSZFlOCsPh" +
            "33aU3rzv4Ayg3zHPw5U+R0mz87xYwX8d7P3SqFJcspSDfQiHoktvJbG2/R0Q04GQ0bkwoiIEeHPd" +
            "i1Tc9jFdTNE34pm/qioL/ctoOebV7bEb2ZAo5uF+hRhrpM3r0j0GLo3sbzTTyKoTGGJAHsDu7eeE" +
            "G8sjQuwYo/IS26zxk+otgPv9ju97YdD+AUyzCd3RPFQbFeHuPYCymyCK18tlhzBn/dJsclIl/412" +
            "T0S8IEXa/dMmUa5OkxSLBFHNb0Lz7IlgYDAVQkOD3bYoVZPMZVRe3rSQpftZ1JyrB/Y1cS2EcRo0" +
            "Dhw/DR42h/ClTsnrbSQ9JeJIN2Ov1SwmVT3/e9sPw/SKAW35SMlxFIaMwP6TyutJQYEhEpG+kfI2" +
            "dtv2saJHs3/0+fU3YqNHgqKleJZeYTkqEHVajq84LMVkqN17McXED7W72WrHwPpxsM+Eg7czJLdf" +
            "FvvkZ88QOGyIwFOPenejVX6ckyJu3AG0LC9wE8DpsEeLkE4s2yEvc/8GhV/vw/W0o2/qpBVEnOTw" +
            "km0c+RV3DQSy38+max+Shkup0aF5KOIhZPLY32nMM5WdQWxTYYboqZbEcqfPH/NyWkTOvZdYgiLu" +
            "m0TbMxLmjFIutGKQMAy7hwYFb6n20LZAniCRYJgCIIL34IzuvRJP/UBui7x6zncS+UPwEkWbYypZ" +
            "/BjvTKzhqA5Or5SUaEHaTcJYcJnsfULU+8kM6V1d1xkKjS+IS3mmdCNrAQzcFhT7D54w16LKR1n6",
        },
        {
          key: "i91lQybw3j3",
          value:
            "i91lQybw3j3JUC1ll5iKVdZL7xU2MhXzTBTR/q6V1hTxR06XmDY8qV+Gr8bJ1hpKV5ol1r99AGB1" +
            "S8/LAvde7kP6Vv7/OtwqPm1CM34mvOIdEknloAl6gnmRkpHjk2a0JI80VYk4UIKJkEt6nTr5XaHg" +
            "zJGJxf3AuXW/0bbJGOuKiEyP+XeIkVLVmd9lobgHNuDvW1uDRAN4SCPD+i3NwdKASgQiT51CTWeO" +
            "LE6KdXVyXRyxDMsYzzNJRtfD921dA08ghrBskMN6SeFGxyqbLmm88nszjWh+PaOxBOgiwadpfb86" +
            "gjSw5NJJ5epwfxsajnpxQAMhxSr9uPT85Wr0LJ6AmfKc2FCOO3Kv8BKjlL5Uu0H2ImvdCxoZi13Y" +
            "941uNyHKQX8PTu3u8tnbBVkwzMdVsozNOpipCI3+xCZ7QuUveGgTMjBte+l6uU9BmJptALgIK9c9" +
            "ji6+jC3haner2tM0oNPcfC7q3oLFBWKfs0V4yKaFYesdJFP13qtV55qrVk/RwOm0o9VTAMx0KB3n" +
            "Wfl2kTPg+cqlSVn2WTLnCKxAaZOVU6rRyNNQHmSC5ab3IDN7pD90fbQsVyMjMLl08oDcE6sZR/w+" +
            "jq9eDcxYZpXtQvv0cNY4efeRNuXm6Ld4K9y3JIefKnLZ/+G4gPxyM0BKKpTOFl3JD6Lbfad+RMWJ" +
            "y4lNa+mSb1mxDzi7LTULoClwlXwg6Oux1C2izTuMmSk1BH6jtrA8IyCjsiZSBQ/EPKPlFy04OUC1" +
            "caoxow4cYRS2Ta5sveOgiiARAgINo5Abrz0ngAoNpInd0L2Nrpe0eKpU2V7L9c8X/PdZ8MGzui/2" +
            "K80U0Wsp1ZOupreLc9enaAD5Nj5iiUtl9qsBhJEzpeLaczZEuLyPK/9SMUJD+toYCi18gwVPAU3k",
        },
        {
          key: "RaMPu5fOJ9t",
          value:
            "RaMPu5fOJ9tGimdLkkMscPvjK67SgSvpXM8NEyxmT+L1qzzitXgNX949yZUnav6LfIZy+9GmmY1a" +
            "VWtcnoWT1hVeXSrIBYBQUJ58nL0tEfbpAZb3Qprqik5ljyJHUuAc+wZRGllGFqp3qF4eURbLyuVb" +
            "VqIazF1rBVaaTutgL440P0iJ09E4ejs8Nr9CCQNd603da+1OHCN2Pk6RRraKCvCZ7vFQaYqapaXW" +
            "Bpqjgex2OkBTdgX+anB/b/Waszq0xy7sVwVuCMinaMfPGWznxKEgxSQoFLbUwowIk7Qhry1f297/" +
            "0dSaX51Bbtp2DfVmJuD0qEEC4AVuPNfOI+5IcG6qnz8/KbGeMejDxUj0xbxi22+SYMpMY35vbIKB",
        },
      ],
    };
  }

  componentDidMount() {
    axios
      .get("/api/auth", {
        cancelToken: this.axiosCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({
            name: res.data.name,
            email: res.data.email,
          });
        }
      });
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  render() {
    // TODO: use custom user uploaded picture for userpic here
    const rows = this.state.ckeys.map((kv) => {
      return (
        <li>
          <ListGroup horizontal>
            <ListGroup.Item>
              <code className={styles.encr_key}>{kv.key}</code>
            </ListGroup.Item>
            <ListGroup.Item>
              <code className={styles.encr_value}>{kv.value}</code>
            </ListGroup.Item>
            <ListGroup.Item>
              <ButtonGroup vertical>
                <Button variant="outline-secondary" size="sm">
                  Copy
                </Button>
                <Button variant="outline-danger" size="sm">
                  Delete
                </Button>
              </ButtonGroup>
            </ListGroup.Item>
          </ListGroup>
        </li>
      );
    });
    return (
      <Container className={styles.page}>
        <h2 className={styles.page_hdr}>
          Encryption keys
          <Emoji symbol="🗝" label="encryption keys" />
        </h2>
        <ul className={styles.keys_list}>
          <li>
            <Button variant="outline-success" as={Link} to="/" className="m-2">
              Add new key
            </Button>
          </li>
          {rows}
        </ul>
        <Button variant="outline-secondary" as={Link} to="/" className="m-2">
          Go back
        </Button>
      </Container>
    );
  }
}

export default withRouter(UserEncryption);
