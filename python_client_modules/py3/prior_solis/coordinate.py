"""Contains the Coordinate class, made for storage and manipulation of coordinates"""

from __future__ import annotations
from typing import Literal, Any

import csv
from math import atan2, cos, degrees, radians, sin, sqrt

from logging import Logger
#from .logger import Logger as CustomLogger

logger_instance: Logger = Logger(__name__)#CustomLogger(__name__).get_logger()


UNIT_TO_NANOMETER: Literal[40] = 40
NM_TO_QM: Literal[1000] = 1000


def get_rotation(btm_point: Coordinate, top_point: Coordinate) -> float:
    """Gets rotation angle in degrees
    Args:
        pnt1 (Coordinate): Bottom corner of line
        pnt2 (Coordinate): Top corner of line
    Returns:
        float: Rotation in degrees
    """
    corner_length: Coordinate = top_point - btm_point
    rotation: float = atan2(corner_length.y, corner_length.x)
    return degrees(rotation)


def rotate_point(point: Coordinate, angle: int | float) -> Coordinate:
    """Deprecated. Rotates a coordinate around the `(0,0)` point by `angle` in degrees"""
    rad_angle: float = radians(angle)
    new_x: float = point.x * cos(rad_angle) - point.y * sin(rad_angle)
    new_y: float = point.x * sin(rad_angle) + point.y * cos(rad_angle)
    return Coordinate(new_x, new_y)


def get_translation(
    initial_point: Coordinate,
    new_point: Coordinate,
    angle: int|float = 0
    ) -> Coordinate:
    """Deprecated. This function is not documented, marked for deletion"""
    rad_angle: float = radians(angle)
    angle_cos:float = cos(rad_angle)
    angle_sin:float = sin(rad_angle)
    x_transl: float = -initial_point.x * angle_cos + initial_point.y * angle_sin + new_point.x
    y_transl: float = -initial_point.x * angle_sin - initial_point.y * angle_cos + new_point.y
    return Coordinate(x_transl, y_transl)


def get_new_points(
    old_points: list[Coordinate],
    old_corners: list[Coordinate],
    new_corners: list[Coordinate]
    ) -> list[Coordinate]:
    """Returns new points of interest based on rotation and/or translation of new corners
    Args:
        old_points (list[Coordinate]): List of old point of interest
        old_corners (list[Coordinate]): Sorted list of old corners
        new_corners (list[Coordinate]): Sorted list of new corners
    Returns:
        list[Coordinate]: List of new calculated points
    """
    new_points: list[Coordinate] = []
    # Get total rotation from both new and old corners
    rotation_old: float = get_rotation(old_corners[0], old_corners[1])
    rotation_new: float = get_rotation(new_corners[0], new_corners[1])
    total_rotation: float = rotation_new - rotation_old

    # Calculate translation using old corner points and new corner points
    translation1: Coordinate = get_translation(old_corners[0], new_corners[0], total_rotation)
    translation2: Coordinate = get_translation(old_corners[1], new_corners[1], total_rotation)
    average_translation: Coordinate = (translation1 + translation2) / 2

    for point in old_points:
        # Generate rotated point from rotation and old point
        point_rotated: Coordinate = rotate_point(point, total_rotation)
        # Calculate new rotated and/or translated point
        new_point: Coordinate = point_rotated + average_translation
        new_points.append(new_point)

    return new_points


def read_all_points_from_file(path_to_file: str)->list[Coordinate]:
    """Reads and returns a list of `Coordinate`s from `path_to_file`"""
    with open(path_to_file, "r",encoding="utf-8") as file:
        list_of_coordinates: list[Coordinate] = []
        for i, row in enumerate(csv.reader(file, delimiter=",")):
            if len(row) > 2:
                logger_instance.error("Wrong file, more than 2 columns detected ! (%i) ", len(row))
                return []
            try:
                x_coord: int = int(row[0])
                y_coord: int = int(row[1])
            except ValueError as err:
                logger_instance.error(
                    "Could not convert %s at line: %i to Integer",
                    err.args[0].split(':')[-1],i+1)
                return []
            coordinate: Coordinate = Coordinate(x_coord, y_coord)
            list_of_coordinates.append(coordinate)
    logger_instance.info("Successfully loaded all points")
    return list_of_coordinates


def save_all_points_to_file(points: list[Coordinate], path: str)->None:
    """Saves a list of `Coordinate`s to `path` as a CSV file"""
    with open(path, "w", newline="", encoding="utf-8") as file:
        csv_writer: Any = csv.writer(file, delimiter=",")
        for point in points:
            csv_writer.writerow(point.tuple)
    logger_instance.info("Successfully saved points at %s", path)


class Coordinate:
    """Holds x and y coordinate. Has manipulation functionality, behaving similarly to vectors"""
    def __init__(self, x: int | float, y: int | float, rounding:bool=False) -> None: # pylint: disable=invalid-name

        # make an exception for x and y
        self.x: int | float = x if not rounding else round(x)# pylint: disable=invalid-name
        self.y: int | float = y if not rounding else round(y)# pylint: disable=invalid-name

        self.x_qm: float = self.x * UNIT_TO_NANOMETER / NM_TO_QM
        self.y_qm: float = self.y * UNIT_TO_NANOMETER / NM_TO_QM

        self.tuple: tuple[int | float, int | float] = self.x, self.y
        self.tuple_qm: tuple[float, float] = self.x_qm, self.y_qm

    def __str__(self) -> str:
        return f"X: {self.x} Y: {self.y}"

    def __add__(self, other: Coordinate) -> Coordinate:
        return Coordinate(self.x + other.x, self.y + other.y)

    def __sub__(self, other: Coordinate) -> Coordinate:
        return Coordinate(self.x - other.x, self.y - other.y)

    def __mul__(self, multiplier: int | float) -> Coordinate:
        return Coordinate(self.x * multiplier, self.y * multiplier)

    def __truediv__(self, divider: int | float) -> Coordinate:
        return Coordinate(self.x / divider, self.y / divider)

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Coordinate):
            return self.x == other.x and self.y == other.y
        return False

    def __abs__(self) -> Coordinate:
        return Coordinate(abs(self.x), abs(self.y))

    def __lt__(self, other: Coordinate) -> bool:
        return (self.y) < (other.y)

    def mag(self)->float:
        """Returns the magnitude of the coordinate as if it was a vector"""
        return sqrt(self.x**2+self.y**2)

    def mag_sq(self)->float:
        """Returns the squared magnitude of the coordinate as if it was a vector"""
        return self.x**2+self.y**2

    def rounded(self)->Coordinate:
        """Returns a new Coordinate with rounded coordinates"""
        return Coordinate(self.x,self.y,rounding=True)

    def dot(self,other:Coordinate)->float:
        """Computes the dot product with `other`. (Treats coordinates as vectors)"""
        return self.x*other.x+self.y*other.y

    def to_dict(self,rounding:bool=False)->dict[str,int|float]:
        """Converts Coordinate to dictionary"""
        return {"x":self.x,"y":self.y} if not rounding else {"x":round(self.x),"y":round(self.y)}

    def to_tuple(self,rounding:bool=False)->tuple[int|float,int|float]:
        """Converts Coordinate to a tuple"""
        return (self.x,self.y) if not rounding else (round(self.x),round(self.y))

    @staticmethod
    def from_dict(dictionary:dict[str,int|float]) -> Coordinate:
        """Converts a dictionary to a Coordinate"""
        return Coordinate(dictionary["x"],dictionary["y"])
