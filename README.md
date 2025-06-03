# FAQing cool FAQ generator
## Tested, Up-to-Date, Automated, Visual documentation
faq.cool is a tool to generate and maintain your documentation in a simple, yet powerful way.

## Example
Create a `demo.yml` with the following:
```yaml
faq:
  version: 0
  voice: en-US-Chirp-HD-F

  script:
    - - say: Go to saucedemo dot com and enter your username and password
      - goto: https://www.saucedemo.com/
      - fill:
          - "#user-name": standard_user
      - mask:
          - "#password": secret_sauce

      - say: Click on the login button
      - click: "#login-button"

    - - say: Click on the item you want to buy

      - click: "#item_5_img_link"

    - - say: And add it to your cart
      - click: "#add-to-cart"

    - - say: "Make sure that the item was added to your cart"
      - highlight: "#shopping_cart_container"

```

Run:
```bash
faq it demo.yml
```

A ten seconds later...
[https://faq.cool/faq/1](https://faq.cool/faq/1)