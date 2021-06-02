import React, { Fragment, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useHistory, useLocation } from "react-router-native";
import { Button, Modal, Card, Text } from "@ui-kitten/components";
import { TopNavigationAccessoriesShowcase } from "../components/TopNavigation";
import { AntDesign } from "@expo/vector-icons";
import { OrderItem } from "../types";

import ComponentWrapper from "../components/orderSummary/WrapComponent";
import CollectionTime from "../components/orderSummary/CollectionTime";
import ArrivalWay from "../components/orderSummary/ArrivalWay";
import PriceTable from "../components/orderSummary/PriceTable";
import { AppContext } from "../context/AppContext";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { createOrderItem } from "../api/queries/createOrderItem";
import { createOrder, getCreateOrderData } from "../api/queries/createOrder";
import { OrderStatusEnum } from "../constants/OrderStatusEnum";
import { getArrivalTime } from "../api/queries/client/getArrivalTime";
import moment from "moment";


interface Props {
  orderList: OrderItem[];
}

export default function OrderSummaryScreen(props: Props) {
  const history = useHistory();
  const { currentOrder, setCurrentOrder } = useContext(AppContext);
  const [arrivalWay, setArrivalWay] = useState<number>(1);
  const [estimatedMinutesToArrival, setEstimatedMinutesToArrival] = useState<number | undefined>(undefined);
  const [cOrder] = useMutation(createOrder);
  const [cOrderItem] = useMutation(createOrderItem);

  const [getEstimatedArrivalTime, { loading, data }] = useLazyQuery(getArrivalTime, { fetchPolicy: "no-cache" });

  const {
    state: { resturantName, items, resturantId },
  } = useLocation();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length == 0) popupAlert();
  }, []);

  const removeItem = () => {
    if (items.length == 0) popupAlert();
  };

  useEffect(() => {
    calcInitialArrivingTime();
  }, [arrivalWay]);

  const calcInitialArrivingTime = () => {
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          console.log(arrivalWay)
          // console.log(position.coords.longitude)
          // console.log(position.coords.latitude)
          // console.log(resturantId)
          console.log(data.getArrivalTime)
          getEstimatedArrivalTime({
            variables: { lon: position.coords.longitude, lat: position.coords.latitude, resId: resturantId, arrivalWay }
          });
          console.log(arrivalWay)
          console.log(data.getArrivalTime)

          if (data) {
            setEstimatedMinutesToArrival(moment.duration(moment(data.getArrivalTime).diff(moment())).asMinutes());
          }

        } catch (err) {
          console.log(err);
          throw new Error('Unable to fetch location')
        }

      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }

  const submitOrder = async () => {
    // (userId: string, arrivingTime: string, notes: string, orderTime: string, restaurantId: string, status: string) => {
    const result = await cOrder({ variables: getCreateOrderData('1abdcc1b-8319-4568-a458-3d68b7fac1d2', undefined, '', new Date(), resturantId, OrderStatusEnum.New, arrivalWay) });

    const id = result.data.createOrder.order.id

    //TODO: Add order items
    // items.foreach(item => await cOrderItem(item))

    setCurrentOrder({ id, orderTime: new Date() });
    history.push({ pathname: 'status', state: { resturantId } });
  }

  const popupAlert = () => {
    setVisible(true);

    setTimeout(() => {
      setVisible(false);
      history.goBack();
    }, 3000);
  };

  return (
    <Fragment>
      <TopNavigationAccessoriesShowcase title="Order Summary" />
      <PriceTable orderList={items} removeItem={removeItem} />
      <ArrivalWay selectedId={arrivalWay} onArrivingWaySelection={(id: number) => setArrivalWay(id)} />
      {estimatedMinutesToArrival !== undefined && <Text style={styles.arrTime}>{`${Math.floor(estimatedMinutesToArrival)} minutes`}</Text>}
      <View style={styles.buttonView}>
        <Button style={styles.button} onPress={() => submitOrder()}>
          Submit Order
        </Button>
      </View>

      <Modal visible={visible} style={styles.modal} backdropStyle={styles.backdrop}>
        <Card disabled={true}>
          <View style={styles.modalTitleArea}>
            <AntDesign name="shoppingcart" style={styles.modalIcon} size={28} color="white" />
            <Text style={styles.modalTitle}>Your order list is empty</Text>
          </View>
          <Text>Youll be redirected to menu page in 3 seconds</Text>
        </Card>
      </Modal>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 2,
    fontSize: 35,
    backgroundColor: "#F85F6A",
    borderColor: "#F85F6A",
  },
  arrTime: {
    marginTop: 10,
    textAlign: 'center'
  },
  buttonView: {
    padding: 30,
  },
  wrapper: {
    padding: 30,
  },
  modal: {
    width: 380,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitleArea: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 14
  },
  modalTitle: {
    fontSize: 25
  },
  modalIcon: {
    paddingRight: 10,
    textAlignVertical: 'bottom',
  },
});